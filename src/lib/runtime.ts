import { env } from "cloudflare:workers";

type RuntimeEnv = Partial<Cloudflare.Env> &
  Record<string, string | D1Database | R2Bucket | Fetcher | undefined>;

export function getRuntimeEnv() {
  return env as RuntimeEnv;
}

function getStringBinding(name: string, fallback = "") {
  const value = getRuntimeEnv()[name];
  return typeof value === "string" ? value : fallback;
}

export function getDb(locals?: App.Locals) {
  return getRuntimeEnv().DB;
}

export function getMediaBucket(locals?: App.Locals) {
  return getRuntimeEnv().MEDIA_BUCKET;
}

export function getSessionSecret(locals?: App.Locals) {
  return getStringBinding("CMS_SESSION_SECRET", "clastro-local-session-secret");
}

export function getAiSettingsEncryptionSecret(locals?: App.Locals) {
  return getStringBinding("AI_SETTINGS_ENCRYPTION_SECRET", getSessionSecret(locals));
}

export function getMediaPublicBaseUrl(locals?: App.Locals) {
  return getStringBinding("MEDIA_PUBLIC_BASE_URL");
}

export function getLinkedInClientId(locals?: App.Locals) {
  return getStringBinding("LINKEDIN_CLIENT_ID");
}

export function getLinkedInClientSecret(locals?: App.Locals) {
  return getStringBinding("LINKEDIN_CLIENT_SECRET");
}

export function getLinkedInApiVersion(locals?: App.Locals) {
  const configured = getStringBinding("LINKEDIN_API_VERSION").trim();

  if (configured) {
    return configured;
  }

  const now = new Date();
  now.setUTCMonth(now.getUTCMonth() - 1);
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

export function getLinkedInOrgScopesEnabled(locals?: App.Locals) {
  const normalized = getStringBinding("LINKEDIN_ENABLE_ORG_SCOPES").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

// ── Deployment-wide Google OAuth client ─────────────────────────────────
//
// Optional. When the operator sets these as Cloudflare vars/secrets
// (typically via `wrangler secret put GOOGLE_OAUTH_CLIENT_SECRET`), every
// Clastro deployment under the same wrangler config uses the same OAuth
// client — the admin only ever sees the "Connect Google account" button.
//
// When NOT set, the Integrations UI falls back to per-deployment Client
// ID / Client Secret fields (stored in D1, encrypted).
export function getDeploymentGoogleOauthClientId(locals?: App.Locals) {
  return getStringBinding("GOOGLE_OAUTH_CLIENT_ID");
}

export function getDeploymentGoogleOauthClientSecret(locals?: App.Locals) {
  return getStringBinding("GOOGLE_OAUTH_CLIENT_SECRET");
}
