// Google Analytics 4 Data API client.
//
// Wraps the GA4 Data API `runReport` endpoint and aggregates the responses
// the CMS dashboard cares about (overview KPIs, top pages, top sources,
// daily sessions timeseries).
//
// Auth-agnostic: the caller supplies an access token (obtained either via
// google-oauth.ts using a refresh token, or via google-service-account.ts
// using a service-account JSON key). This file doesn't care how the token
// was minted, only that it has the analytics.readonly scope.
//
// Also exports `listGoogleAnalyticsProperties` for the Integrations
// property-picker dropdown — uses the GA4 Admin API to enumerate every
// property the access token can see.

export const GA4_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

export interface GoogleAnalyticsParams {
  accessToken: string;
  propertyId: string;
  days: number;
}

export interface GoogleAnalyticsResult {
  period: { since: string; until: string; days: number };
  totals: {
    sessions: number;
    activeUsers: number;
    engagementRate: number;
    averageSessionDurationSec: number;
  };
  timeseries: Array<{ date: string; sessions: number; activeUsers: number }>;
  topPages: Array<{ path: string; title: string; sessions: number; activeUsers: number }>;
  topSources: Array<{ source: string; medium: string; sessions: number }>;
}

export async function fetchGoogleAnalytics(
  params: GoogleAnalyticsParams,
): Promise<GoogleAnalyticsResult> {
  const { accessToken, propertyId, days } = params;
  if (!propertyId.trim()) {
    throw new Error("GA4 property ID is not set.");
  }
  const normalizedDays = days > 0 ? Math.floor(days) : 7;
  const dateRange = { startDate: `${normalizedDays}daysAgo`, endDate: "today" };

  const [totalsRes, timeseriesRes, topPagesRes, topSourcesRes] = await Promise.all([
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      metrics: [
        { name: "sessions" },
        { name: "activeUsers" },
        { name: "engagementRate" },
        { name: "averageSessionDuration" },
      ],
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "date" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ dimension: { dimensionName: "date" } }],
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "pagePath" }, { name: "pageTitle" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
    runReport(accessToken, propertyId, {
      dateRanges: [dateRange],
      dimensions: [{ name: "sessionSource" }, { name: "sessionMedium" }],
      metrics: [{ name: "sessions" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 10,
    }),
  ]);

  const totalsRow = totalsRes.rows?.[0]?.metricValues || [];
  const totals = {
    sessions: numberAt(totalsRow, 0),
    activeUsers: numberAt(totalsRow, 1),
    engagementRate: fractionAt(totalsRow, 2),
    averageSessionDurationSec: numberAt(totalsRow, 3),
  };

  const timeseries = (timeseriesRes.rows || []).map((row) => ({
    date: formatGa4Date(stringDimensionAt(row, 0)),
    sessions: numberMetricAt(row, 0),
    activeUsers: numberMetricAt(row, 1),
  }));

  const topPages = (topPagesRes.rows || []).map((row) => ({
    path: stringDimensionAt(row, 0) || "(unknown)",
    title: stringDimensionAt(row, 1) || "",
    sessions: numberMetricAt(row, 0),
    activeUsers: numberMetricAt(row, 1),
  }));

  const topSources = (topSourcesRes.rows || []).map((row) => ({
    source: stringDimensionAt(row, 0) || "(direct)",
    medium: stringDimensionAt(row, 1) || "(none)",
    sessions: numberMetricAt(row, 0),
  }));

  const since = isoDateDaysAgo(normalizedDays);
  const until = isoDateDaysAgo(0);

  return {
    period: { since, until, days: normalizedDays },
    totals,
    timeseries,
    topPages,
    topSources,
  };
}

// ── Low-level helpers ──────────────────────────────────────────────────

interface GA4Row {
  dimensionValues?: Array<{ value?: string }>;
  metricValues?: Array<{ value?: string }>;
}

interface GA4Response {
  rows?: GA4Row[];
}

async function runReport(
  accessToken: string,
  propertyId: string,
  body: Record<string, unknown>,
): Promise<GA4Response> {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(
    propertyId,
  )}:runReport`;
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
      `GA4 Data API error (${response.status}): ${truncate(text, 240)}`,
    );
  }
  return (await response.json()) as GA4Response;
}

function numberAt(values: Array<{ value?: string }>, idx: number): number {
  const raw = values[idx]?.value;
  if (!raw) return 0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function fractionAt(values: Array<{ value?: string }>, idx: number): number {
  // GA4 returns engagementRate as a 0..1 decimal already.
  return numberAt(values, idx);
}

function numberMetricAt(row: GA4Row, idx: number): number {
  return numberAt(row.metricValues || [], idx);
}

function stringDimensionAt(row: GA4Row, idx: number): string {
  const raw = row.dimensionValues?.[idx]?.value;
  return raw ?? "";
}

function formatGa4Date(yyyymmdd: string): string {
  // GA4 returns "YYYYMMDD"; normalize to "YYYY-MM-DD" for the UI.
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
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

// ── Property list (for Integrations dropdown) ──────────────────────────

export interface GoogleAnalyticsPropertySummary {
  propertyId: string;       // numeric, what the Data API wants
  displayName: string;      // user-facing
  accountDisplayName: string;
}

interface AccountSummariesResponse {
  accountSummaries?: Array<{
    account?: string;
    displayName?: string;
    propertySummaries?: Array<{
      property?: string;        // "properties/123456789"
      displayName?: string;
    }>;
  }>;
  nextPageToken?: string;
}

/**
 * Enumerate every GA4 property the access token can see, across every
 * account. Uses the Admin API v1beta accountSummaries.list endpoint.
 *
 * Paginates internally — paginates rarely matter (most users have <10
 * accounts) but we follow nextPageToken for completeness.
 */
export async function listGoogleAnalyticsProperties(
  accessToken: string,
): Promise<GoogleAnalyticsPropertySummary[]> {
  const result: GoogleAnalyticsPropertySummary[] = [];
  let pageToken: string | undefined;
  do {
    const url = new URL("https://analyticsadmin.googleapis.com/v1beta/accountSummaries");
    url.searchParams.set("pageSize", "200");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new Error(
        `GA4 Admin API error (${response.status}): ${truncate(text, 240)}`,
      );
    }
    const data = (await response.json()) as AccountSummariesResponse;
    for (const account of data.accountSummaries || []) {
      const accountDisplayName = account.displayName || "(unnamed account)";
      for (const property of account.propertySummaries || []) {
        // property is "properties/123456789" — strip the prefix.
        const propertyId = (property.property || "").replace(/^properties\//, "");
        if (!propertyId) continue;
        result.push({
          propertyId,
          displayName: property.displayName || `Property ${propertyId}`,
          accountDisplayName,
        });
      }
    }
    pageToken = data.nextPageToken;
  } while (pageToken);
  return result;
}
