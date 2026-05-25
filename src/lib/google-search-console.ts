// Google Search Console client.
//
// Wraps the `searchanalytics.query` endpoint of the Search Console API and
// aggregates the four views the CMS dashboard cares about:
//   - Overview totals (clicks, impressions, CTR, average position)
//   - Daily timeseries (clicks, impressions)
//   - Top queries
//   - Top pages
//
// Auth is delegated to ./google-service-account.ts — the same service-account
// JSON used by GA4 is re-used here; the user just needs to add the service
// account email as a Restricted user on the Search Console property.

import { getGoogleAccessToken } from "./google-service-account";

const GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

export interface GoogleSearchConsoleParams {
  serviceAccountJson: string;
  siteUrl: string;
  days: number;
}

export interface GoogleSearchConsoleResult {
  period: { since: string; until: string; days: number };
  totals: {
    clicks: number;
    impressions: number;
    ctr: number; // 0..1
    averagePosition: number;
  };
  timeseries: Array<{ date: string; clicks: number; impressions: number }>;
  topQueries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  topPages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export async function fetchGoogleSearchConsole(
  params: GoogleSearchConsoleParams,
): Promise<GoogleSearchConsoleResult> {
  const { serviceAccountJson, siteUrl, days } = params;
  if (!siteUrl.trim()) {
    throw new Error("Search Console site URL is not set.");
  }
  const normalizedDays = days > 0 ? Math.floor(days) : 7;
  const accessToken = await getGoogleAccessToken(serviceAccountJson, [GSC_SCOPE]);
  const startDate = isoDateDaysAgo(normalizedDays);
  const endDate = isoDateDaysAgo(0);

  const [totalsRes, timeseriesRes, queriesRes, pagesRes] = await Promise.all([
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      // No dimensions → returns a single row with the aggregate totals.
    }),
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["date"],
      rowLimit: 1000,
    }),
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["query"],
      rowLimit: 10,
    }),
    runQuery(accessToken, siteUrl, {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 10,
    }),
  ]);

  const totalsRow = totalsRes.rows?.[0];
  const totals = {
    clicks: numberOr(totalsRow?.clicks, 0),
    impressions: numberOr(totalsRow?.impressions, 0),
    ctr: numberOr(totalsRow?.ctr, 0),
    averagePosition: numberOr(totalsRow?.position, 0),
  };

  const timeseries = (timeseriesRes.rows || [])
    .map((row) => ({
      date: keyAt(row, 0),
      clicks: numberOr(row.clicks, 0),
      impressions: numberOr(row.impressions, 0),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const topQueries = (queriesRes.rows || []).map((row) => ({
    query: keyAt(row, 0),
    clicks: numberOr(row.clicks, 0),
    impressions: numberOr(row.impressions, 0),
    ctr: numberOr(row.ctr, 0),
    position: numberOr(row.position, 0),
  }));

  const topPages = (pagesRes.rows || []).map((row) => ({
    page: keyAt(row, 0),
    clicks: numberOr(row.clicks, 0),
    impressions: numberOr(row.impressions, 0),
    ctr: numberOr(row.ctr, 0),
    position: numberOr(row.position, 0),
  }));

  return {
    period: { since: startDate, until: endDate, days: normalizedDays },
    totals,
    timeseries,
    topQueries,
    topPages,
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
