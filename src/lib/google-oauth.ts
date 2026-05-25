// Google OAuth 2.0 authorization-code flow.
//
// This is the user-auth alternative to ./google-service-account.ts. Instead
// of impersonating a service account, an admin signs in as themselves and
// grants Clastro long-lived access (via a refresh token) to read their
// GA4 + Search Console data.
//
// Why we use this in addition to service accounts:
//   - GSC's "Add user" UI refuses to add service-account emails on URL-prefix
//     properties, and is flaky on domain properties for newly-created
//     service accounts. OAuth user auth sidesteps that entirely — the admin
//     already has GSC access; we just re-use it.
//   - One sign-in covers every GA4 property and every GSC site the admin can
//     see, so the dashboard's property picker can populate dropdowns instead
//     of asking the admin to copy/paste IDs.
//
// Access tokens are cached in-memory per refresh token until ~60 seconds
// before expiry. Cache is per-isolate (process-local on Workers).

export const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "openid",
].join(" ");

const AUTHZ_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const USERINFO_ENDPOINT = "https://openidconnect.googleapis.com/v1/userinfo";

const ACCESS_TOKEN_CACHE = new Map<string, { accessToken: string; expiresAt: number }>();
const SAFETY_WINDOW_MS = 60_000;

/**
 * Build the URL the admin's browser should be redirected to in order to
 * grant Clastro access. `state` should be a random server-generated string
 * stored in a short-lived cookie so we can verify the callback came from
 * the same browser session.
 */
export function buildAuthorizationUrl(params: {
  clientId: string;
  redirectUri: string;
  state: string;
}): string {
  const search = new URLSearchParams({
    client_id: params.clientId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: GOOGLE_OAUTH_SCOPES,
    access_type: "offline",        // we want a refresh token
    prompt: "consent",              // force the refresh-token to be issued every time
    include_granted_scopes: "true",
    state: params.state,
  });
  return `${AUTHZ_ENDPOINT}?${search.toString()}`;
}

/**
 * Exchange the one-time `code` from the OAuth redirect for a refresh token
 * + access token + identity claims (so we can record which Google account
 * was connected, for display in the UI).
 */
export async function exchangeCodeForTokens(params: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<{
  refreshToken: string;
  accessToken: string;
  expiresInSec: number;
  email: string;
}> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    code: params.code,
    redirect_uri: params.redirectUri,
  });
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OAuth code exchange failed (${response.status}): ${truncate(text, 240)}`);
  }
  const payload = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (payload.error) {
    throw new Error(
      `OAuth code exchange refused: ${payload.error}${
        payload.error_description ? ` — ${payload.error_description}` : ""
      }`,
    );
  }
  if (!payload.access_token || !payload.refresh_token || typeof payload.expires_in !== "number") {
    throw new Error(
      "OAuth code exchange response missing access_token / refresh_token / expires_in. " +
        "Make sure the OAuth client was created as a 'Web application' and that the user " +
        "saw the consent screen this session (we pass prompt=consent to force this).",
    );
  }

  const email = await fetchEmailForAccessToken(payload.access_token);

  return {
    refreshToken: payload.refresh_token,
    accessToken: payload.access_token,
    expiresInSec: payload.expires_in,
    email,
  };
}

/**
 * Get an access token for the given refresh token. Cached in-memory until
 * just before expiry. The cache key combines the client ID with the refresh
 * token so two Clastro deployments sharing the same client never trample
 * each other's cache entries (defensive — they shouldn't share clients).
 */
export async function getAccessTokenFromRefresh(params: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const cacheKey = `${params.clientId}::${params.refreshToken}`;
  const cached = ACCESS_TOKEN_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt - now > SAFETY_WINDOW_MS) {
    return cached.accessToken;
  }

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
  });
  const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`OAuth token refresh failed (${response.status}): ${truncate(text, 240)}`);
  }
  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (payload.error) {
    throw new Error(
      `OAuth token refresh refused: ${payload.error}${
        payload.error_description ? ` — ${payload.error_description}` : ""
      }`,
    );
  }
  if (!payload.access_token || typeof payload.expires_in !== "number") {
    throw new Error("OAuth refresh response missing access_token / expires_in.");
  }

  ACCESS_TOKEN_CACHE.set(cacheKey, {
    accessToken: payload.access_token,
    expiresAt: now + payload.expires_in * 1000,
  });
  return payload.access_token;
}

/**
 * Tell Google to invalidate the refresh token. Best-effort — we still clear
 * the local DB even if this fails. Suppresses errors because the user might
 * have already revoked access from their Google Account page.
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  if (!token) return;
  try {
    await fetch(REVOKE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }).toString(),
    });
  } catch {
    // best-effort
  }
}

async function fetchEmailForAccessToken(accessToken: string): Promise<string> {
  try {
    const response = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) return "";
    const data = (await response.json()) as { email?: string };
    return typeof data.email === "string" ? data.email : "";
  } catch {
    return "";
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
