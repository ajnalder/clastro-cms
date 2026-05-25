-- Migration: 0.3.x → 0.4.0
--
-- Adds Google OAuth columns to analytics_settings so the dashboard can
-- authenticate to GA4 + Search Console via a connected Google account
-- (instead of, or alongside, a service account JSON key).
--
-- Apply against the live D1 database with:
--   wrangler d1 execute clastro-cms-demo-db --remote --file db/migrations/0.3-to-0.4.sql
--
-- Re-running is safe: each ALTER is guarded by a "column already exists"
-- error which SQLite raises as "duplicate column name". D1 will report
-- the error but the other ALTERs in the batch still run, so a fresh DB
-- ends up with all four columns.

ALTER TABLE analytics_settings ADD COLUMN google_oauth_client_id TEXT;
ALTER TABLE analytics_settings ADD COLUMN google_oauth_client_secret_encrypted TEXT;
ALTER TABLE analytics_settings ADD COLUMN google_oauth_refresh_token_encrypted TEXT;
ALTER TABLE analytics_settings ADD COLUMN google_oauth_email TEXT;
