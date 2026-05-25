-- Migration: 0.2.x → 0.3.0
--
-- v0.3.0 introduced the GA4 + Search Console analytics integration, which
-- required a new analytics_settings table. This migration was missing from
-- the v0.3.0 release — fresh installs got the table via db/schema.sql but
-- there was no path for v0.2.0 deployments to bring their existing D1 in
-- line. Backfilled here so the v0.2 → v0.5 upgrade path works.
--
-- The table is created with the exact v0.3.0 shape (cloudflare_* + ga4_* +
-- gsc_* columns). The OAuth columns added in v0.4.0 are layered on top by
-- the next migration (0.3-to-0.4.sql) — run both in sequence for a full
-- v0.2 → v0.4+ upgrade.
--
-- The cloudflare_* columns existed in the v0.3.0 schema but were unused
-- (Cloudflare analytics had just been stripped). Kept here for fidelity
-- to the historical schema so the column set matches what fresh v0.3.0
-- installs have — easier to reason about and consistent across deployments.
--
-- Apply against the live D1 database with:
--   wrangler d1 execute <db-name> --remote --file db/migrations/0.2-to-0.3.sql

CREATE TABLE IF NOT EXISTS analytics_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  cloudflare_api_token_encrypted TEXT,
  cloudflare_account_id TEXT,
  cloudflare_zone_id TEXT,
  cloudflare_hostname TEXT,
  ga4_property_id TEXT,
  ga4_service_account_json_encrypted TEXT,
  gsc_site_url TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
