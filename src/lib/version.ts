export interface ClastroChangelogEntry {
  date: string;
  summary: string;
  version: string;
  changes: string[];
}

export const CLASTRO_VERSION = "0.5.0";

export const CLASTRO_CHANGELOG: ClastroChangelogEntry[] = [
  {
    version: "0.5.0",
    date: "2026-05-25",
    summary: "Dashboard goes from vanity-metric to actionable: period comparisons, form-submissions tile, SEO opportunities, device/country splits, AI search referrals.",
    changes: [
      "Period-over-period change badges on every KPI tile: ↑12% green, ↓8% red, with the avg-position metric inverted (lower = better). Both GA4 and Search Console now fetch the same-length prior window in the same request so comparisons cost no extra API calls for GA4.",
      "Form submissions is now a first-class KPI tile alongside Sessions / Active Users / Clicks / Avg Position. Shows count for the period, prior-period comparison, and \"N unread in inbox\" detail. Backed by a new GET /api/dashboard/form-submissions endpoint.",
      "New SEO opportunities (striking distance) panel: queries ranking position 4–20 with 50+ impressions, sorted by impressions/position upside. The kind of insight you'd pay $200/month for at Semrush — derived from the existing Search Console pull (no extra API cost).",
      "New Devices + Countries breakdown widgets pulled from GA4's deviceCategory and country dimensions. Two extra runReport calls per dashboard load.",
      "New AI search referrals widget: detects sessions from ChatGPT, Claude, Gemini, Perplexity, Copilot, etc. by filtering the existing topSources data (no extra API cost).",
      "Bumped GA4 topSources fetch from 10 to 25 rows so AI-referral detection has enough data to work with, and bumped GSC topQueries fetch from 10 to 100 rows so the striking-distance set is meaningful.",
    ],
  },
  {
    version: "0.4.1",
    date: "2026-05-25",
    summary: "Deployment-wide OAuth client: ship a Cloudflare secret once, every install shows a single Connect button.",
    changes: [
      "Clastro now reads GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET from Cloudflare bindings. When set, the Integrations panel hides the OAuth Client ID / Secret fields entirely and just shows a Connect Google account button — no per-deployment OAuth client provisioning required.",
      "Per-deployment DB-stored Client ID / Secret values still take precedence if an admin explicitly pastes them, so starter forks without env vars keep working unchanged.",
      "Setup for operators running multiple deployments: create one OAuth client in your GCP project, add every deployment's /api/auth/google/callback to its Authorized redirect URIs, then `wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET` and add GOOGLE_OAUTH_CLIENT_ID as a var. Every site you ship inherits the connection.",
    ],
  },
  {
    version: "0.4.0",
    date: "2026-05-25",
    summary: "Connect Google with one click: OAuth flow + property/site pickers replace the service-account dance.",
    changes: [
      "New Google Account card in Integrations: a super admin pastes an OAuth Client ID + Secret, clicks Connect Google account, signs in as themselves, and the refresh token is stored encrypted. One sign-in covers GA4 + Search Console.",
      "GA4 Property and Search Console Site fields are now populated as dropdowns sourced from accountSummaries.list and sites.list respectively — no more typing numeric property IDs or guessing whether to use the sc-domain: prefix.",
      "Service-account JSON moves to an 'Advanced: use a service account instead' disclosure — kept as a fallback for unattended auth setups, but OAuth is the recommended path because Search Console's UI is hostile to service-account emails.",
      "Existing GA4 + Search Console API routes now prefer the OAuth refresh token when present, and fall back to the service account JSON if not — so 0.3.x setups keep working without changes.",
      "New endpoints: GET /api/auth/google/start, GET /api/auth/google/callback, POST /api/auth/google/disconnect, GET /api/analytics/ga4/properties, GET /api/analytics/search-console/sites.",
      "New src/lib/google-oauth.ts: authorization URL builder, code-for-tokens exchange, refresh-to-access-token swap with in-memory cache, revoke helper. Refresh tokens and client secrets encrypted via the same AI_SETTINGS_ENCRYPTION_SECRET envelope as every other provider secret.",
      "DB migration db/migrations/0.3-to-0.4.sql adds four columns to analytics_settings (google_oauth_client_id, google_oauth_client_secret_encrypted, google_oauth_refresh_token_encrypted, google_oauth_email). Run with wrangler d1 execute against the live database.",
    ],
  },
  {
    version: "0.3.1",
    date: "2026-05-25",
    summary: "Dashboard lights up: live GA4 + Search Console KPIs and supporting panels.",
    changes: [
      "Added a Search Console client (src/lib/google-search-console.ts) that wraps the searchAnalytics.query endpoint for overview totals, daily clicks/impressions timeseries, top queries, and top pages.",
      "New GET /api/analytics/search-console?period=7d|30d|90d returning the same { configured, ...data, error } envelope as the GA4 endpoint.",
      "Rebuilt the Dashboard analytics section: KPI tiles for Sessions, Active users, Clicks, and Avg position; daily sessions sparkline; top pages, top sources, and top search queries panels. GA4 and Search Console are fetched in parallel, both errors surface independently, and the period selector drives both.",
      "Sensible empty state when an integration is connected but no data has been collected yet (e.g. the GA4 tag hasn't started firing or Search Console hasn't finished its 48-hour warm-up).",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-05-23",
    summary: "Analytics swap: Cloudflare out, Google Analytics 4 + Search Console in.",
    changes: [
      "Removed the Cloudflare analytics integration — its API token, zone ID, hostname filter, GraphQL helpers, dashboard tiles, and Integrations card are all gone.",
      "Added a Google service-account auth helper (src/lib/google-service-account.ts) that signs an RS256 JWT via WebCrypto and exchanges it at oauth2.googleapis.com/token. Access tokens are cached in-memory per (service account + scope set) until just before expiry.",
      "Added a Google Analytics 4 client (src/lib/google-analytics.ts) that fans out to the GA4 Data API runReport endpoint for overview KPIs, daily sessions timeseries, top pages, and top sources.",
      "New GET /api/analytics/ga4?period=7d|30d|90d returning the same shape the old Cloudflare endpoint did, so the dashboard can swap in cleanly.",
      "Integrations tab now hosts editable Google Analytics 4 and Google Search Console cards; the service-account JSON is stored encrypted with the same AI_SETTINGS_ENCRYPTION_SECRET-backed envelope as other provider secrets.",
      "Search Console wiring + the combined dashboard rebuild are scheduled for the next release.",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-05-21",
    summary: "Admin redesign, generic content items, email + form submissions, donor-field cleanup.",
    changes: [
      "Redesigned the admin shell, sidebar, dashboard, content lists, media library, and modals on Tailwind + shadcn primitives with a deep-navy + cyan theme and dark-mode-first tokens.",
      "Introduced the generic content-items pattern: drop a definition into src/lib/content-types.ts and the sidebar entry, list pane, search, editor form, and CRUD API are generated automatically. Ships with Categories, Authors, and Team Members.",
      "Added a reference field type so Products link to Categories and Posts link to Authors — same pattern for any future cross-collection link.",
      "Auto-slug on every name/title field, with manual edits stopping the auto-sync. Consistent across Products, Posts, and all content items.",
      "Image fields throughout the admin now upload directly to the media library (with per-image alt text on product galleries) instead of relying on raw URL paste.",
      "New Email tab under Config: Resend API key (encrypted), notification recipient, and an inbox of form submissions. Public sites POST to /api/forms/<type> to capture submissions.",
      "New public catalogue (/products + /products/[slug]) showcasing the data the admin edits, grouped by Category content item.",
      "Removed all donor-site HVAC fields from Products (heating_kw, cooling_kw, aircon_type, family_code, family_name, install_summary, brochure_label, brochure_href, installation_cost) and their UI, repo methods, schema columns, and seed.",
      "Added AGENTS.md as the LLM contributor contract — slug, image, content-item, and reference conventions all documented in one place.",
    ],
  },
  {
    version: "0.1.1",
    date: "2026-05-21",
    summary: "Version visibility and public changelog.",
    changes: [
      "Added a shared Clastro version constant that matches package.json.",
      "Added a public changelog page for tracking starter development over time.",
      "Added a visible CMS version badge in the admin sidebar.",
      "Linked the changelog from the demo footer seed data.",
    ],
  },
  {
    version: "0.1.0",
    date: "2026-05-21",
    summary: "Initial reusable Clastro CMS starter.",
    changes: [
      "Created the generic Clastro CMS starter from the latest role-aware implementation.",
      "Added the dummy public site for testing pages, posts, products, media, and the live editor.",
      "Provisioned Cloudflare D1, KV, and R2 resources for the deployed demo.",
      "Seeded the starter database with generic content and a first super-admin account.",
      "Added documentation for starting new client projects and porting core upgrades.",
    ],
  },
];
