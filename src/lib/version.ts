export interface ClastroChangelogEntry {
  date: string;
  summary: string;
  version: string;
  changes: string[];
}

export const CLASTRO_VERSION = "0.3.1";

export const CLASTRO_CHANGELOG: ClastroChangelogEntry[] = [
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
