// Google service-account auth helper.
//
// Builds a signed JWT (RS256) from a service-account JSON key, exchanges it
// at https://oauth2.googleapis.com/token for an OAuth2 access token, and
// caches the result in-memory until ~60 seconds before expiry.
//
// Runs on Cloudflare Workers (and any other runtime with WebCrypto).
//
// The caller passes the JSON key (already decrypted from D1) and the list of
// scopes — currently used for:
//   - https://www.googleapis.com/auth/analytics.readonly   (GA4 Data API)
//   - https://www.googleapis.com/auth/webmasters.readonly  (Search Console)
//
// Usage:
//   const token = await getGoogleAccessToken(serviceAccountJson, [
//     "https://www.googleapis.com/auth/analytics.readonly",
//   ]);
//
// `getGoogleAccessToken` throws if the JSON is malformed or Google rejects
// the exchange; surface that error to the caller verbatim.

export interface ServiceAccountKey {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms when the token actually expires
}

const TOKEN_CACHE = new Map<string, CachedToken>();
const SAFETY_WINDOW_MS = 60_000;

const DEFAULT_TOKEN_URI = "https://oauth2.googleapis.com/token";

/**
 * Parse the raw service-account JSON. Throws a descriptive Error if the
 * payload is missing the fields we need.
 */
export function parseServiceAccountJson(raw: string): ServiceAccountKey {
  if (!raw || !raw.trim()) {
    throw new Error("Service account JSON is empty.");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Service account JSON is not valid JSON.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Service account JSON must be an object.");
  }
  const key = parsed as Record<string, unknown>;
  const clientEmail = typeof key.client_email === "string" ? key.client_email : "";
  const privateKey = typeof key.private_key === "string" ? key.private_key : "";
  if (!clientEmail || !privateKey) {
    throw new Error(
      "Service account JSON is missing client_email or private_key — paste the entire key file.",
    );
  }
  return {
    client_email: clientEmail,
    private_key: privateKey,
    token_uri: typeof key.token_uri === "string" ? key.token_uri : DEFAULT_TOKEN_URI,
  };
}

/**
 * Get a Google OAuth2 access token for the given service account + scopes.
 * Cached in-memory per (service-account email + scope set) until just before
 * expiry. The cache is process-local — each Worker isolate gets its own.
 */
export async function getGoogleAccessToken(
  rawJson: string,
  scopes: string[],
): Promise<string> {
  if (scopes.length === 0) {
    throw new Error("getGoogleAccessToken requires at least one scope.");
  }
  const key = parseServiceAccountJson(rawJson);
  const cacheKey = `${key.client_email}::${[...scopes].sort().join(" ")}`;

  const cached = TOKEN_CACHE.get(cacheKey);
  const now = Date.now();
  if (cached && cached.expiresAt - now > SAFETY_WINDOW_MS) {
    return cached.accessToken;
  }

  const { accessToken, expiresInSec } = await requestAccessToken(key, scopes);
  TOKEN_CACHE.set(cacheKey, {
    accessToken,
    expiresAt: now + expiresInSec * 1000,
  });
  return accessToken;
}

async function requestAccessToken(
  key: ServiceAccountKey,
  scopes: string[],
): Promise<{ accessToken: string; expiresInSec: number }> {
  const tokenUri = key.token_uri || DEFAULT_TOKEN_URI;
  const jwt = await buildSignedJwt(key, scopes, tokenUri);

  const body = new URLSearchParams({
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion: jwt,
  });

  const response = await fetch(tokenUri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(
      `Google token exchange failed (${response.status}): ${truncate(errText, 240)}`,
    );
  }

  const payload = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (payload.error) {
    throw new Error(
      `Google token exchange refused: ${payload.error}${
        payload.error_description ? ` — ${payload.error_description}` : ""
      }`,
    );
  }
  if (!payload.access_token || typeof payload.expires_in !== "number") {
    throw new Error("Google token response missing access_token / expires_in.");
  }
  return { accessToken: payload.access_token, expiresInSec: payload.expires_in };
}

async function buildSignedJwt(
  key: ServiceAccountKey,
  scopes: string[],
  audience: string,
): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: key.client_email,
    scope: scopes.join(" "),
    aud: audience,
    iat: nowSec,
    exp: nowSec + 3600,
  };
  const headerB64 = base64UrlEncode(textEncoder.encode(JSON.stringify(header)));
  const claimB64 = base64UrlEncode(textEncoder.encode(JSON.stringify(claim)));
  const signingInput = `${headerB64}.${claimB64}`;

  const cryptoKey = await importPrivateKey(key.private_key);
  const signatureBuf = await crypto.subtle.sign(
    { name: "RSASSA-PKCS1-v1_5" },
    cryptoKey,
    textEncoder.encode(signingInput),
  );
  const signatureB64 = base64UrlEncode(new Uint8Array(signatureBuf));
  return `${signingInput}.${signatureB64}`;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const der = pemToDer(pem);
  return crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

function pemToDer(pem: string): ArrayBuffer {
  const cleaned = pem
    .replace(/-----BEGIN [A-Z ]+-----/g, "")
    .replace(/-----END [A-Z ]+-----/g, "")
    .replace(/\s+/g, "");
  if (!cleaned) {
    throw new Error("Service account private_key is empty or malformed.");
  }
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const textEncoder = new TextEncoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}
