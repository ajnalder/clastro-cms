// Google Search Console client.
//
// Wraps the `searchanalytics.query` endpoint of the Search Console API and
// aggregates the four views the CMS dashboard cares about:
//   - Overview totals (clicks, impressions, CTR, average position)
//   - Daily timeseries (clicks, impressions)
//   - Top queries
//   - Top pages
//
// Auth-agnostic: the caller supplies an access token. In practice that
// comes from google-oauth.ts (preferred — GSC's "Add user" UI is hostile
// to service accounts) or from google-service-account.ts.
//
// Also exports `listGoogleSearchConsoleSites` for the Integrations site-
// picker dropdown.

export const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export interface GoogleSearchConsoleParams {
  accessToken: string;
  siteUrl: string;
  days: number;
}

export interface GoogleSearchConsoleTotals {
  clicks: number;
  impressions: number;
  ctr: number; // 0..1
  averagePosition: number;
}

export interface GoogleSearchConsoleQueryRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GoogleSearchConsoleResult {
  period: { since: string; until: string; days: number };
  previousPeriod: { since: string; until: string; days: number };
  totals: GoogleSearchConsoleTotals;
  previousTotals: GoogleSearchConsoleTotals;
  timeseries: Array<{ date: string; clicks: number; impressions: number }>;
  topQueries: GoogleSearchConsoleQueryRow[];
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  // Queries at position 4-20 with 50+ impressions — easy wins to invest
  // content/optimization in to reach page 1. Sorted by an opportunity score
  // that combines impressions and how close the current position is to top.
  strikingDistance: GoogleSearchConsoleQueryRow[];
}

export async function fetchGoogleSearchConsole(
  params: GoogleSearchConsoleParams,
): Promise<GoogleSearchConsoleResult> {
  const { accessToken, siteUrl, days } = params;
  if (!siteUrl.trim()) {
    throw new Error("Search Console site URL is not set.");
  }
  const normalizedDays = days > 0 ? Math.floor(days) : 7;
  const startDate = isoDateDaysAgo(normalizedDays);
  const endDate = isoDateDaysAgo(0);
  const prevStartDate = isoDateDaysAgo(normalizedDays * 2);
  const prevEndDate = isoDateDaysAgo(normalizedDays + 1);

  const [
    totalsRes,
    prevTotalsRes,
    timeseriesRes,
    queriesRes,
    pagesRes,
  ] = await Promise.all([
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      // No dimensions → returns a single row with the aggregate totals.
    }),
    // Previous-period totals for the % change badges on KPI tiles.
    runQuery(accessToken, siteUrl, {
      startDate: prevStartDate,
      endDate: prevEndDate,
    }),
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["date"],
      rowLimit: 1000,
    }),
    // Bumped from 10 to 100 so we have enough query rows to filter the
    // striking-distance set (position 4-20, 50+ impressions).
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 100,
    }),
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 10,
    }),
  ]);

  const totalsRow = totalsRes.rows?.[0];
  const totals: GoogleSearchConsoleTotals = {
    clicks: numberOr(totalsRow?.clicks, 0),
    impressions: numberOr(totalsRow?.impressions, 0),
    ctr: numberOr(totalsRow?.ctr, 0),
    averagePosition: numberOr(totalsRow?.position, 0),
  };
  const prevRow = prevTotalsRes.rows?.[0];
  const previousTotals: GoogleSearchConsoleTotals = {
    clicks: numberOr(prevRow?.clicks, 0),
    impressions: numberOr(prevRow?.impressions, 0),
    ctr: numberOr(prevRow?.ctr, 0),
    averagePosition: numberOr(prevRow?.position, 0),
  };

  const timeseries = (timeseriesRes.rows || [])
    .map((row) => ({
      date: keyAt(row, 0),
      clicks: numberOr(row.clicks, 0),
      impressions: numberOr(row.impressions, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const allQueries: GoogleSearchConsoleQueryRow[] = (queriesRes.rows || []).map((row) => ({
    query: keyAt(row, 0),
    clicks: numberOr(row.clicks, 0),
    impressions: numberOr(row.impressions, 0),
    ctr: numberOr(row.ctr, 0),
    position: numberOr(row.position, 0),
  }));

  // Top 10 by clicks (existing behaviour) — already sorted by GSC for us.
  const topQueries = allQueries.slice(0, 10);

  // Striking distance: queries that are *almost* ranking well.
  // - Position 4 to 20: above page 1 #4-10 = good but not best slot;
  //   page 2 = 11-20 = one push away from page 1.
  // - 50+ impressions: enough demand that moving up actually matters.
  // Score: impressions weighted by how close to position 1 you are.
  // (Higher impressions × closer position = more upside.)
  const strikingDistance = allQueries
    .filter((q) => q.position >= 4 && q.position <= 20 && q.impressions >= 50)
    .map((q) => ({ ...q, _score: q.impressions / Math.max(1, q.position) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, 10)
    .map(({ _score, ...q }) => q);

  const topPages = (pagesRes.rows || []).map((row) => ({
    page: keyAt(row, 0),
    clicks: numberOr(row.clicks, 0),
    impressions: numberOr(row.impressions, 0),
    ctr: numberOr(row.ctr, 0),
    position: numberOr(row.position, 0),
  }));

  return {
    period: { since: startDate, until: endDate, days: normalizedDays },
    previousPeriod: { since: prevStartDate, until: prevEndDate, days: normalizedDays },
    totals,
    previousTotals,
    timeseries,
    topQueries,
    topPages,
    strikingDistance,
  };
}

// ── Low-level helpers ──────────────────────────────────────────────────

interface GSCRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

interface GSCResponse {
  rows?: GSCRow[];
}

async function runQuery(
  accessToken: string,
  siteUrl: string,
  body: Record<string, unknown>,
): Promise<GSCResponse> {
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
    siteUrl,
  )}/searchAnalytics/query`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Search Console API error (${response.status}): ${truncate(text, 240)}`,
    );
  }
  return (await response.json()) as GSCResponse;
}

function numberOr(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  return fallback;
}

function keyAt(row: GSCRow, idx: number): string {
  return row.keys?.[idx] ?? "";
}

function isoDateDaysAgo(daysAgo: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

// ── Site list (for Integrations dropdown) ──────────────────────────────

export interface GoogleSearchConsoleSiteSummary {
  siteUrl: string;          // exact identifier the API wants, e.g. "sc-domain:example.com"
  permissionLevel: string;  // "siteOwner" | "siteFullUser" | "siteRestrictedUser" | "siteUnverifiedUser"
}

/**
 * Enumerate every Search Console site the access token can see.
 * Filters out unverified properties (you can't query data for those).
 */
export async function listGoogleSearchConsoleSites(
  accessToken: string,
): Promise<GoogleSearchConsoleSiteSummary[]> {
  const response = await fetch("https://www.googleapis.com/webmasters/v3/sites", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Search Console sites.list error (${response.status}): ${truncate(text, 240)}`,
    );
  }
  const data = (await response.json()) as {
    siteEntry?: Array<{ siteUrl?: string; permissionLevel?: string }>;
  };
  return (data.siteEntry || [])
    .filter((entry) => entry.siteUrl && entry.permissionLevel && entry.permissionLevel !== "siteUnverifiedUser")
    .map((entry) => ({
      siteUrl: entry.siteUrl!,
      permissionLevel: entry.permissionLevel!,
    }));
}
