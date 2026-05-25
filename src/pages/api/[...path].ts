import type { APIRoute } from "astro";
import { timingSafeEqual } from "node:crypto";

import { generateAiPostDraft, generateAiPostTitleIdeas } from "../../lib/ai";
import type { CmsUserFeatureVisibility } from "../../lib/defaults";
import { fetchGoogleAnalytics, listGoogleAnalyticsProperties, GA4_SCOPE } from "../../lib/google-analytics";
import { fetchGoogleSearchConsole, listGoogleSearchConsoleSites, GSC_SCOPE } from "../../lib/google-search-console";
import { getGoogleAccessToken } from "../../lib/google-service-account";
import {
  buildAuthorizationUrl,
  exchangeCodeForTokens,
  getAccessTokenFromRefresh,
  revokeRefreshToken,
} from "../../lib/google-oauth";
import {
  buildLogoutCookie,
  buildSessionCookie,
  createInvitationToken,
  createSessionToken,
  getCurrentUser,
  hashInvitationToken,
  hashPassword,
  isOwnerRole,
  isSuperAdminRole,
  normalizeCmsUserRole,
  verifyPassword,
} from "../../lib/auth";
import {
  getDb,
  getSessionSecret,
  getDeploymentGoogleOauthClientId,
  getDeploymentGoogleOauthClientSecret,
} from "../../lib/runtime";
import {
  canAssignRole,
  canDeleteUser,
  canUpdateUserRole,
} from "../../lib/role-policy";
import {
  getLinkedInApiVersion,
  getLinkedInClientId,
  getLinkedInClientSecret,
  getLinkedInOrgScopesEnabled,
} from "../../lib/runtime";
import {
  buildMediaUrl,
  createCmsUser,
  createUserInvitation,
  deleteCmsUser,
  deleteLinkedInConnectionByUserId,
  getAiSettings,
  getActiveInvitationByEmail,
  getCmsUserById,
  getCmsUserByEmail,
  getCmsUserFeatureVisibility,
  getUserInvitationByTokenHash,
  getLinkedInConnectionByUserId,
  getLinkedInSettings,
  upsertLinkedInConnection,
  type CmsPageRecord,
  type CmsPostRecord,
  type CmsProductRecord,
  deleteCatalogProductBySlug,
  deletePostBySlug,
  getCatalogProductBySlug,
  getMediaByFilename,
  getMediaObject,
  getPageBySlug,
  getPostBySlug,
  getSiteSettings,
  listCmsUsers,
  listCatalogProducts,
  archiveFormSubmission,
  createFormSubmission,
  deleteContentItem,
  getAnalyticsSettings,
  upsertAnalyticsSettings,
  deleteFormSubmissionById,
  deleteMediaRecord,
  getContentItem,
  getEmailSettings,
  getFormSubmissionById,
  listContentItems,
  listFormSubmissions,
  sendResendEmail,
  upsertContentItem,
  upsertEmailSettings,
  getMediaById,
  listMedia,
  updateMediaAlt,
  listPages,
  listPosts,
  listUserInvitations,
  markUserInvitationAccepted,
  putMediaObject,
  revokeUserInvitation,
  saveMediaRecord,
  upsertAiSettings,
  upsertCmsFeatureFlags,
  upsertCmsUserFeatureVisibility,
  upsertLinkedInSettings,
  upsertCatalogProduct,
  updateCmsUserRole,
  upsertPage,
  upsertPost,
  upsertSiteSettings,
} from "../../lib/repository";

function json(data: unknown, status = 200, headers: HeadersInit = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

function notFound() {
  return json({ error: "Not found" }, 404);
}

function badRequest(message: string) {
  return json({ error: message }, 400);
}

function normalizeFeatureVisibility(value: Partial<CmsUserFeatureVisibility> | null | undefined): CmsUserFeatureVisibility {
  return {
    showAiSettings: value?.showAiSettings !== false,
    showAiBlogTools: value?.showAiBlogTools !== false,
    showLinkedIn: value?.showLinkedIn !== false,
  };
}

function wantsJsonResponse(request: Request) {
  const accept = request.headers.get("accept") || "";
  const contentType = request.headers.get("content-type") || "";
  return accept.includes("application/json") || contentType.includes("application/json");
}

function getRedirectTarget(request: Request, fallback = "/admin") {
  const redirect = new URL(request.url).searchParams.get("redirect") || fallback;
  if (!redirect.startsWith("/") || redirect.startsWith("//")) {
    return fallback;
  }
  return redirect;
}

function redirectToPath(request: Request, path: string, status = 303, headers: HeadersInit = {}) {
  const url = new URL(path, request.url);
  return new Response(null, {
    status,
    headers: {
      location: `${url.pathname}${url.search}${url.hash}`,
      ...headers,
    },
  });
}

function redirectToLoginError(request: Request, error: string) {
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("error", error);
  return redirectToPath(request, `${url.pathname}${url.search}${url.hash}`);
}

const GOOGLE_OAUTH_STATE_COOKIE = "clastro_google_oauth_state";
const GOOGLE_OAUTH_CALLBACK_PATH = "/api/auth/google/callback";

function buildGoogleOauthRedirectUri(request: Request): string {
  // Build the absolute https URL of /api/auth/google/callback for the
  // current host. This must EXACTLY match one of the "Authorized
  // redirect URIs" configured on the OAuth 2.0 Client ID in GCP.
  const url = new URL(GOOGLE_OAUTH_CALLBACK_PATH, request.url);
  return url.toString();
}

/**
 * Resolves the effective OAuth client for this deployment.
 *
 * Priority order:
 *   1. Per-deployment values stored in D1 (only if an admin pasted them)
 *   2. Deployment-wide Cloudflare env/secret bindings
 *
 * Returns `{ clientId, clientSecret, source }` where `source` indicates
 * which path was used, for surfacing in the GET /integrations/analytics
 * response so the UI can collapse the inputs when env vars are in play.
 */
function resolveGoogleOauthClient(
  locals: App.Locals | undefined,
  settings: { googleOauthClientId: string; googleOauthClientSecret: string },
): { clientId: string; clientSecret: string; source: "db" | "deployment" | "none" } {
  if (settings.googleOauthClientId && settings.googleOauthClientSecret) {
    return {
      clientId: settings.googleOauthClientId,
      clientSecret: settings.googleOauthClientSecret,
      source: "db",
    };
  }
  const envClientId = getDeploymentGoogleOauthClientId(locals);
  const envClientSecret = getDeploymentGoogleOauthClientSecret(locals);
  if (envClientId && envClientSecret) {
    return {
      clientId: envClientId,
      clientSecret: envClientSecret,
      source: "deployment",
    };
  }
  return { clientId: "", clientSecret: "", source: "none" };
}

function buildStateCookie(state: string, maxAgeSec: number): string {
  return [
    `${GOOGLE_OAUTH_STATE_COOKIE}=${state}`,
    "Path=/",
    `Max-Age=${maxAgeSec}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function clearStateCookie(): string {
  return `${GOOGLE_OAUTH_STATE_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function readStateCookie(request: Request): string {
  const cookie = request.headers.get("cookie") || "";
  for (const part of cookie.split(/;\s*/)) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq) === GOOGLE_OAUTH_STATE_COOKIE) {
      return part.slice(eq + 1);
    }
  }
  return "";
}

/**
 * Returns an access token for a Google API call given the current analytics
 * settings, preferring OAuth (admin's own Google account) and falling back
 * to a service-account JSON if no OAuth token is connected. Throws if
 * neither auth method is configured.
 */
async function getGoogleAnalyticsAccessToken(
  locals: App.Locals | undefined,
  settings: {
    ga4ServiceAccountJson: string;
    googleOauthClientId: string;
    googleOauthClientSecret: string;
    googleOauthRefreshToken: string;
  },
): Promise<{ accessToken: string; source: "oauth" | "service-account" }> {
  if (settings.googleOauthRefreshToken) {
    const client = resolveGoogleOauthClient(locals, settings);
    if (client.clientId && client.clientSecret) {
      const token = await getAccessTokenFromRefresh({
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        refreshToken: settings.googleOauthRefreshToken,
      });
      return { accessToken: token, source: "oauth" };
    }
  }
  if (settings.ga4ServiceAccountJson) {
    const token = await getGoogleAccessToken(settings.ga4ServiceAccountJson, [
      GA4_SCOPE,
      GSC_SCOPE,
    ]);
    return { accessToken: token, source: "service-account" };
  }
  throw new Error(
    "No Google authentication configured — connect a Google account or paste a service account JSON.",
  );
}

async function requireAdmin(context: Parameters<APIRoute>[0]) {
  const user = await getCurrentUser(context.request, context.locals);

  if (!user) {
    return {
      response: json({ error: "Unauthorized" }, 401),
      user: null,
    };
  }

  return { response: null, user };
}

async function requireOwner(context: Parameters<APIRoute>[0]) {
  const auth = await requireAdmin(context);

  if (auth.response || !auth.user) {
    return auth;
  }

  if (!isOwnerRole(auth.user.role)) {
    return {
      response: json({ error: "Forbidden" }, 403),
      user: auth.user,
    };
  }

  return auth;
}

async function requireSuperAdmin(context: Parameters<APIRoute>[0]) {
  const auth = await requireAdmin(context);

  if (auth.response || !auth.user) {
    return auth;
  }

  if (!isSuperAdminRole(auth.user.role)) {
    return {
      response: json({ error: "Forbidden" }, 403),
      user: auth.user,
    };
  }

  return auth;
}

async function requireFeatureAccess(
  context: Parameters<APIRoute>[0],
  feature: "ai-blog-tools" | "ai-settings" | "blog" | "linkedin",
) {
  const auth = await requireAdmin(context);

  if (auth.response || !auth.user) {
    return auth;
  }

  if (isSuperAdminRole(auth.user.role) || feature === "blog") {
    return auth;
  }

  const visibility = await getCmsUserFeatureVisibility(context.locals, auth.user);
  const allowed = feature === "ai-settings"
    ? visibility.showAiSettings
    : feature === "ai-blog-tools"
      ? visibility.showAiBlogTools
      : visibility.showLinkedIn;

  if (!allowed) {
    return {
      response: json({ error: "Forbidden" }, 403),
      user: auth.user,
    };
  }

  return auth;
}

async function canUserAccessFeature(
  context: Parameters<APIRoute>[0],
  user: Awaited<ReturnType<typeof getCurrentUser>>,
  feature: "ai-blog-tools" | "ai-settings" | "blog" | "linkedin",
) {
  if (!user) {
    return false;
  }

  if (isSuperAdminRole(user.role) || feature === "blog") {
    return true;
  }

  const visibility = await getCmsUserFeatureVisibility(context.locals, user);
  return feature === "ai-settings"
    ? visibility.showAiSettings
    : feature === "ai-blog-tools"
      ? visibility.showAiBlogTools
      : visibility.showLinkedIn;
}

function getSegments(rawPath?: string) {
  return (rawPath || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });
}

interface LinkedInOauthStatePayload {
  exp: number;
  nonce: string;
  sub: string;
}

interface LinkedInTokenResponse {
  access_token?: string;
  expires_in?: number;
  scope?: string;
}

interface LinkedInUserInfoResponse {
  email?: string;
  email_verified?: boolean;
  family_name?: string;
  given_name?: string;
  locale?: string;
  name?: string;
  picture?: string;
  sub?: string;
}

interface LinkedInCreatePostResponse {
  id?: string;
  error?: string;
  message?: string;
  code?: string;
  status?: number;
}

interface LinkedInOrganizationAclsResponse {
  elements?: Array<{
    organization?: string;
    organizationTarget?: string;
  }>;
}

interface LinkedInOrganizationProfileResponse {
  localizedName?: string;
  name?: string;
}

interface LinkedInShareTarget {
  name: string;
  type: "organization" | "person";
  urn: string;
}

const LINKEDIN_ORG_SCOPES = [
  "w_organization_social",
  "rw_organization_admin",
];

function encodeBase64Url(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? Buffer.from(value, "utf8") : Buffer.from(value);
  return bytes.toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url");
}

async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

async function createLinkedInOauthState(userId: string, secret: string) {
  const payload: LinkedInOauthStatePayload = {
    sub: userId,
    nonce: encodeBase64Url(crypto.getRandomValues(new Uint8Array(12))),
    exp: Math.floor(Date.now() / 1000) + 60 * 10,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = await hmacSha256(secret, encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function verifyLinkedInOauthState(state: string, userId: string, secret: string) {
  const [encodedPayload, encodedSignature] = state.split(".");

  if (!encodedPayload || !encodedSignature) {
    return null;
  }

  const expectedSignature = await hmacSha256(secret, encodedPayload);

  if (encodedSignature.length !== expectedSignature.length) {
    return null;
  }

  if (
    !timingSafeEqual(
      Buffer.from(encodedSignature, "utf8"),
      Buffer.from(expectedSignature, "utf8"),
    )
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      decodeBase64Url(encodedPayload).toString("utf8"),
    ) as LinkedInOauthStatePayload;

    if (!payload?.sub || payload.sub !== userId || payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function getLinkedInCallbackUrl(request: Request) {
  const url = new URL(request.url);
  return `${url.origin}/api/linkedin/callback`;
}

function redirectToAdminWithLinkedInStatus(
  request: Request,
  status: "connected" | "error" | "disconnected",
  message?: string,
) {
  const url = new URL("/admin", request.url);
  url.searchParams.set("linkedin", status);
  if (message) {
    url.searchParams.set("linkedin_message", message);
  }
  return redirectToPath(request, `${url.pathname}${url.search}${url.hash}`, 303);
}

async function parseJsonBody<T>(request: Request) {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (err) {
    console.error("parseJsonBody error:", err, "bodyUsed:", request.bodyUsed);
    return null;
  }
}

async function exchangeLinkedInCodeForToken(params: {
  callbackUrl: string;
  clientId: string;
  clientSecret: string;
  code: string;
}) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code: params.code,
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.callbackUrl,
  });

  const response = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  const payload = (await response.json()) as LinkedInTokenResponse & { error?: string };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload?.error || "LinkedIn token exchange failed.");
  }

  return payload;
}

async function fetchLinkedInUserInfo(accessToken: string) {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  const payload = (await response.json()) as LinkedInUserInfoResponse & { error?: string };

  if (!response.ok || !payload.sub) {
    throw new Error(payload?.error || "LinkedIn user profile lookup failed.");
  }

  return payload;
}

function toLinkedInPersonUrn(linkedInSub: string) {
  return linkedInSub.startsWith("urn:li:person:") ? linkedInSub : `urn:li:person:${linkedInSub}`;
}

function isLinkedInVersionInactiveError(
  response: Response,
  errorMessage: string,
  errorCode?: string,
) {
  return (
    response.status === 426
    || /requested version .* is not active/i.test(errorMessage)
    || /nonexistent_version/i.test(errorMessage)
    || errorCode === "NONEXISTENT_VERSION"
  );
}

function parseLinkedInOrganizationId(organizationUrn: string) {
  const match = organizationUrn.match(/^urn:li:organization:(\d+)$/);
  return match?.[1] || "";
}

function parseOAuthScopeSet(scope: string | undefined) {
  return new Set(
    String(scope || "")
      .split(/\s+/)
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

async function fetchLinkedInOrganizationUrns(params: {
  accessToken: string;
  apiVersions: string[];
}) {
  let lastError = "";

  for (const apiVersion of params.apiVersions) {
    const url = new URL("https://api.linkedin.com/rest/organizationAcls");
    url.searchParams.set("q", "roleAssignee");
    url.searchParams.set("state", "APPROVED");

    const response = await fetch(url.toString(), {
      headers: {
        authorization: `Bearer ${params.accessToken}`,
        "linkedin-version": apiVersion,
        "x-restli-protocol-version": "2.0.0",
      },
    });

    const rawBody = await response.text();
    let payload = {} as LinkedInCreatePostResponse & LinkedInOrganizationAclsResponse;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as LinkedInCreatePostResponse & LinkedInOrganizationAclsResponse;
      } catch {
        payload = {};
      }
    }

    if (response.ok) {
      const urns = Array.from(
        new Set(
          (payload.elements || [])
            .map((entry) => String(entry.organization || entry.organizationTarget || "").trim())
            .filter((value) => value.startsWith("urn:li:organization:")),
        ),
      );
      return { permissionError: false, urns };
    }

    const errorMessage =
      payload.message
      || payload.error
      || rawBody
      || "LinkedIn organization lookup failed.";
    lastError = errorMessage;

    if (response.status === 403) {
      return { permissionError: true, urns: [] as string[] };
    }

    if (!isLinkedInVersionInactiveError(response, errorMessage, payload.code)) {
      break;
    }
  }

  if (lastError) {
    throw new Error(lastError);
  }

  return { permissionError: false, urns: [] as string[] };
}

async function fetchLinkedInOrganizationName(params: {
  accessToken: string;
  apiVersions: string[];
  organizationUrn: string;
}) {
  const organizationId = parseLinkedInOrganizationId(params.organizationUrn);
  if (!organizationId) {
    return params.organizationUrn;
  }

  let lastError = "";

  for (const apiVersion of params.apiVersions) {
    const response = await fetch(`https://api.linkedin.com/rest/organizations/${organizationId}`, {
      headers: {
        authorization: `Bearer ${params.accessToken}`,
        "linkedin-version": apiVersion,
        "x-restli-protocol-version": "2.0.0",
      },
    });

    const rawBody = await response.text();
    let payload = {} as LinkedInCreatePostResponse & LinkedInOrganizationProfileResponse;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as LinkedInCreatePostResponse & LinkedInOrganizationProfileResponse;
      } catch {
        payload = {};
      }
    }

    if (response.ok) {
      return String(payload.localizedName || payload.name || params.organizationUrn).trim();
    }

    const errorMessage =
      payload.message
      || payload.error
      || rawBody
      || "LinkedIn organization profile lookup failed.";
    lastError = errorMessage;

    if (!isLinkedInVersionInactiveError(response, errorMessage, payload.code)) {
      break;
    }
  }

  if (lastError) {
    console.warn("fetchLinkedInOrganizationName fallback:", lastError);
  }
  return params.organizationUrn;
}

async function listLinkedInShareTargets(params: {
  accessToken: string;
  apiVersions: string[];
  linkedInName?: string;
  linkedInSub: string;
}) {
  const personUrn = toLinkedInPersonUrn(params.linkedInSub);
  const targets: LinkedInShareTarget[] = [
    {
      urn: personUrn,
      type: "person",
      name: params.linkedInName?.trim() || "My Profile",
    },
  ];

  const organizations = await fetchLinkedInOrganizationUrns({
    accessToken: params.accessToken,
    apiVersions: params.apiVersions,
  });

  if (organizations.urns.length) {
    const organizationTargets = await Promise.all(
      organizations.urns.map(async (organizationUrn) => ({
        urn: organizationUrn,
        type: "organization" as const,
        name: await fetchLinkedInOrganizationName({
          accessToken: params.accessToken,
          apiVersions: params.apiVersions,
          organizationUrn,
        }),
      })),
    );
    targets.push(...organizationTargets);
  }

  return {
    permissionError: organizations.permissionError,
    targets,
  };
}

async function createLinkedInPost(params: {
  accessToken: string;
  apiVersions: string[];
  articleUrl: string;
  authorUrn: string;
  excerpt: string;
  title: string;
}) {
  const author = params.authorUrn.startsWith("urn:")
    ? params.authorUrn
    : toLinkedInPersonUrn(params.authorUrn);
  const commentary = `${params.title}\n\n${params.excerpt}`.trim();
  let lastError = "LinkedIn post publish failed.";

  for (const apiVersion of params.apiVersions) {
    const response = await fetch("https://api.linkedin.com/rest/posts", {
      method: "POST",
      headers: {
        authorization: `Bearer ${params.accessToken}`,
        "content-type": "application/json",
        "linkedin-version": apiVersion,
        "x-restli-protocol-version": "2.0.0",
      },
      body: JSON.stringify({
        author,
        commentary,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
        content: {
          article: {
            source: params.articleUrl,
            title: params.title,
          },
        },
      }),
    });

    const rawBody = await response.text();
    let payload = {} as LinkedInCreatePostResponse;
    if (rawBody) {
      try {
        payload = JSON.parse(rawBody) as LinkedInCreatePostResponse;
      } catch {
        payload = {};
      }
    }
    const headerPostId = response.headers.get("x-restli-id") || "";
    const postId = payload.id || headerPostId;

    if (response.ok) {
      return { ...payload, id: postId };
    }

    const errorMessage =
      payload.message
      || payload.error
      || rawBody
      || "LinkedIn post publish failed.";
    lastError = errorMessage;
    if (!isLinkedInVersionInactiveError(response, errorMessage, payload.code)) {
      break;
    }
  }

  throw new Error(lastError);
}

function previousLinkedInApiVersion(version: string) {
  const year = Number.parseInt(version.slice(0, 4), 10);
  const month = Number.parseInt(version.slice(4, 6), 10);

  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) {
    return version;
  }

  const date = new Date(Date.UTC(year, month - 1, 1));
  date.setUTCMonth(date.getUTCMonth() - 1);
  return `${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function buildLinkedInApiVersionCandidates(preferred: string) {
  const candidates = [preferred];
  candidates.push(previousLinkedInApiVersion(candidates[candidates.length - 1]));
  candidates.push(previousLinkedInApiVersion(candidates[candidates.length - 1]));
  return [...new Set(candidates)];
}

async function parseLoginBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return parseJsonBody<{ email?: string; password?: string }>(request);
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    try {
      const formData = await request.formData();
      return {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
      };
    } catch (err) {
      console.error("parseLoginBody formData error:", err);
      return null;
    }
  }

  return parseJsonBody<{ email?: string; password?: string }>(request);
}

async function handleMediaFileRequest(context: Parameters<APIRoute>[0], filename: string) {
  const media = await getMediaByFilename(context.locals, filename);

  if (!media) {
    return new Response("Not found", { status: 404 });
  }

  const object = await getMediaObject(context.locals, media.r2Key);

  if (object?.body) {
    return new Response(object.body, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": object.httpMetadata?.contentType || media.mimeType || "application/octet-stream",
      },
    });
  }

  if (media.sourceUrl) {
    const fallbackResponse = await fetch(media.sourceUrl);

    if (fallbackResponse.ok) {
      return new Response(fallbackResponse.body, {
        status: fallbackResponse.status,
        headers: {
          "cache-control": "public, max-age=3600",
          "content-type":
            fallbackResponse.headers.get("content-type") || media.mimeType || "application/octet-stream",
        },
      });
    }
  }

  return new Response("Not found", { status: 404 });
}

export const GET: APIRoute = async (context) => {
  const segments = getSegments(context.params.path);

  if (segments[0] === "auth" && segments[1] === "login") {
    return redirectToPath(context.request, "/admin/login", 302);
  }

  if (segments[0] === "auth" && segments[1] === "session") {
    const user = await getCurrentUser(context.request, context.locals);
    return json({ user });
  }

  if (segments[0] === "auth" && segments[1] === "invite") {
    const token = new URL(context.request.url).searchParams.get("token") || "";

    if (!token.trim()) {
      return badRequest("Invitation token is required.");
    }

    const invitation = await getUserInvitationByTokenHash(
      context.locals,
      await hashInvitationToken(token.trim(), getSessionSecret(context.locals)),
    );

    if (!invitation) {
      return json({ error: "Invitation not found." }, 404);
    }

    if (invitation.acceptedAt) {
      return json({ error: "This invitation has already been accepted." }, 410);
    }

    if (invitation.revokedAt) {
      return json({ error: "This invitation has been revoked." }, 410);
    }

    if (Date.parse(invitation.expiresAt) <= Date.now()) {
      return json({ error: "This invitation has expired." }, 410);
    }

    return json({
      invitation: {
        email: invitation.email,
        expiresAt: invitation.expiresAt,
        name: invitation.name,
        role: invitation.role,
      },
    });
  }

  if (segments[0] === "users" && segments.length === 1) {
    const auth = await requireOwner(context);
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const [users, invitations] = await Promise.all([
      listCmsUsers(context.locals),
      listUserInvitations(context.locals),
    ]);

    return json({
      currentUserId: auth.user.id,
      invitations,
      users,
    });
  }

  if (segments[0] === "linkedin" && segments[1] === "connect") {
    const auth = await requireFeatureAccess(context, "linkedin");
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const clientId = getLinkedInClientId(context.locals).trim();

    if (!clientId) {
      return json({ error: "LinkedIn client ID is not configured." }, 500);
    }

    const callbackUrl = getLinkedInCallbackUrl(context.request);
    const state = await createLinkedInOauthState(
      auth.user.id,
      getSessionSecret(context.locals),
    );
    const baseScopes = ["openid", "profile", "email", "w_member_social"];
    const requestedScopes = getLinkedInOrgScopesEnabled(context.locals)
      ? [...baseScopes, ...LINKEDIN_ORG_SCOPES, "r_organization_admin", "r_organization_social"]
      : baseScopes;
    const authorizeUrl = new URL("https://www.linkedin.com/oauth/v2/authorization");
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", clientId);
    authorizeUrl.searchParams.set("redirect_uri", callbackUrl);
    authorizeUrl.searchParams.set("scope", requestedScopes.join(" "));
    authorizeUrl.searchParams.set("state", state);

    return new Response(null, {
      status: 302,
      headers: {
        location: authorizeUrl.toString(),
      },
    });
  }

  if (segments[0] === "linkedin" && segments[1] === "callback") {
    const auth = await requireAdmin(context);
    if (auth.response || !auth.user) {
      return redirectToPath(context.request, "/admin/login", 302);
    }

    const url = new URL(context.request.url);
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (error) {
      return redirectToAdminWithLinkedInStatus(
        context.request,
        "error",
        errorDescription || error,
      );
    }

    if (!code || !state) {
      return redirectToAdminWithLinkedInStatus(
        context.request,
        "error",
        "LinkedIn callback missing code or state.",
      );
    }

    const statePayload = await verifyLinkedInOauthState(
      state,
      auth.user.id,
      getSessionSecret(context.locals),
    );

    if (!statePayload) {
      return redirectToAdminWithLinkedInStatus(
        context.request,
        "error",
        "LinkedIn auth state verification failed.",
      );
    }

    const clientId = getLinkedInClientId(context.locals).trim();
    const clientSecret = getLinkedInClientSecret(context.locals).trim();

    if (!clientId || !clientSecret) {
      return redirectToAdminWithLinkedInStatus(
        context.request,
        "error",
        "LinkedIn app credentials are not configured in worker secrets.",
      );
    }

    try {
      const callbackUrl = getLinkedInCallbackUrl(context.request);
      const token = await exchangeLinkedInCodeForToken({
        code,
        callbackUrl,
        clientId,
        clientSecret,
      });
      if (!token.access_token) {
        return redirectToAdminWithLinkedInStatus(context.request, "error", "LinkedIn did not return an access token.");
      }
      const accessToken = token.access_token;
      const userInfo = await fetchLinkedInUserInfo(accessToken);
      if (!userInfo.sub) {
        return redirectToAdminWithLinkedInStatus(context.request, "error", "LinkedIn user info did not include a subject identifier.");
      }
      const linkedInSub = userInfo.sub;
      const expiresAt = token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000).toISOString()
        : undefined;
      const scope = token.scope || "openid profile email w_member_social";

      await upsertLinkedInConnection(context.locals, {
        userId: auth.user.id,
        linkedInSub,
        linkedInName: userInfo.name
          || [userInfo.given_name, userInfo.family_name].filter(Boolean).join(" ").trim()
          || linkedInSub,
        linkedInEmail: userInfo.email,
        accessToken,
        expiresAt,
        scope,
      });

      return redirectToAdminWithLinkedInStatus(context.request, "connected");
    } catch (callbackError) {
      return redirectToAdminWithLinkedInStatus(
        context.request,
        "error",
        callbackError instanceof Error ? callbackError.message : "LinkedIn connect failed.",
      );
    }
  }

  if (segments[0] === "linkedin" && segments[1] === "connection") {
    const auth = await requireFeatureAccess(context, "linkedin");
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const connection = await getLinkedInConnectionByUserId(context.locals, auth.user.id);

    if (!connection) {
      return json({ connected: false });
    }

    return json({
      connected: true,
      expiresAt: connection.expiresAt || null,
      linkedInEmail: connection.linkedInEmail || null,
      linkedInName: connection.linkedInName || null,
      linkedInSub: connection.linkedInSub,
      scope: connection.scope || null,
    });
  }

  if (segments[0] === "linkedin" && segments[1] === "targets") {
    const auth = await requireFeatureAccess(context, "linkedin");
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const connection = await getLinkedInConnectionByUserId(context.locals, auth.user.id);
    if (!connection?.accessToken || !connection.linkedInSub) {
      return json({ connected: false, selectedTargetUrn: null, targets: [] });
    }

    const linkedInSettings = await getLinkedInSettings(context.locals);
    const apiVersions = buildLinkedInApiVersionCandidates(getLinkedInApiVersion(context.locals));
    const orgScopesEnabled = getLinkedInOrgScopesEnabled(context.locals);
    const grantedScopes = parseOAuthScopeSet(connection.scope);
    const missingOrgScopes = (orgScopesEnabled ? LINKEDIN_ORG_SCOPES : []).filter(
      (scope) => !grantedScopes.has(scope),
    );
    const targetList = missingOrgScopes.length
      ? {
          permissionError: true,
          targets: [
            {
              urn: toLinkedInPersonUrn(connection.linkedInSub),
              type: "person" as const,
              name: connection.linkedInName?.trim() || "My Profile",
            },
          ],
        }
      : await listLinkedInShareTargets({
          accessToken: connection.accessToken,
          apiVersions,
          linkedInName: connection.linkedInName,
          linkedInSub: connection.linkedInSub,
        });

    const fallbackUrn = toLinkedInPersonUrn(connection.linkedInSub);
    const preferredUrn = linkedInSettings.organizationUrn?.trim()
      || linkedInSettings.authorUrn?.trim()
      || fallbackUrn;
    const selectedTargetUrn = targetList.targets.some((target) => target.urn === preferredUrn)
      ? preferredUrn
      : fallbackUrn;

    return json({
      connected: true,
      missingOrgScopes,
      orgScopesEnabled,
      permissionError: targetList.permissionError,
      selectedTargetUrn,
      targets: targetList.targets,
    });
  }

  if (segments[0] === "settings") {
    const settings = await getSiteSettings(context.locals);
    return json(settings);
  }

  if (segments[0] === "feature-flags") {
    const auth = await requireAdmin(context);
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    return json(await getCmsUserFeatureVisibility(context.locals, auth.user));
  }

  if (segments[0] === "ai-settings") {
    const auth = await requireFeatureAccess(context, "ai-settings");
    if (auth.response) {
      return auth.response;
    }

    const settings = await getAiSettings(context.locals);
    return json({
      ...settings,
      apiKey: "",
      hasApiKey: Boolean(settings.apiKey),
    });
  }

  if (segments[0] === "linkedin-settings") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }

    const settings = await getLinkedInSettings(context.locals);
    return json({
      ...settings,
      clientSecret: "",
      accessToken: "",
      hasClientSecret: Boolean(settings.clientSecret),
      hasAccessToken: Boolean(settings.accessToken),
    });
  }

  if (segments[0] === "pages" && segments.length === 1) {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }

    return json(await listPages(context.locals));
  }

  if (segments[0] === "pages" && segments.length >= 2) {
    const page = await getPageBySlug(context.locals, segments.slice(1).join("/"));
    return page ? json(page) : notFound();
  }

  if (segments[0] === "posts" && segments.length === 1) {
    const user = await getCurrentUser(context.request, context.locals);
    const includeUnpublished = await canUserAccessFeature(context, user, "blog");
    return json({ docs: await listPosts(context.locals, { includeUnpublished }) });
  }

  if (segments[0] === "posts" && segments.length >= 2) {
    const user = await getCurrentUser(context.request, context.locals);
    const includeUnpublished = await canUserAccessFeature(context, user, "blog");
    const post = await getPostBySlug(context.locals, segments.slice(1).join("/"), {
      includeUnpublished,
    });
    return post ? json(post) : notFound();
  }

  if (segments[0] === "products" && segments.length === 1) {
    const user = await getCurrentUser(context.request, context.locals);
    return json({ docs: await listCatalogProducts(context.locals, { includeUnpublished: Boolean(user) }) });
  }

  if (segments[0] === "products" && segments.length >= 2) {
    const user = await getCurrentUser(context.request, context.locals);
    const product = await getCatalogProductBySlug(context.locals, segments.slice(1).join("/"), {
      includeUnpublished: Boolean(user),
    });
    return product ? json(product) : notFound();
  }

  if (segments[0] === "media" && segments[1] === "file" && segments[2]) {
    return handleMediaFileRequest(context, segments.slice(2).join("/"));
  }

  if (segments[0] === "media" && segments.length === 1) {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }

    return json(await listMedia(context.locals));
  }

  if (segments[0] === "content-items" && segments[1]) {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }

    const type = segments[1];

    if (segments[2]) {
      const item = await getContentItem(context.locals, type, segments[2]);
      return item ? json(item) : notFound();
    }

    return json(await listContentItems(context.locals, type));
  }

  if (segments[0] === "email" && segments[1] === "settings") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const settings = await getEmailSettings(context.locals);
    // Return a masked version of the API key
    return json({
      fromEmail: settings.fromEmail,
      fromName: settings.fromName,
      hasResendApiKey: Boolean(settings.resendApiKey),
      notificationEmail: settings.notificationEmail,
    });
  }

  if (segments[0] === "email" && segments[1] === "submissions") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const url = new URL(context.request.url);
    const includeArchived = url.searchParams.get("archived") === "1";
    return json(await listFormSubmissions(context.locals, { includeArchived }));
  }

  if (segments[0] === "integrations" && segments[1] === "analytics") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const settings = await getAnalyticsSettings(context.locals);
    const client = resolveGoogleOauthClient(context.locals, settings);
    return json({
      ga4PropertyId: settings.ga4PropertyId,
      gscSiteUrl: settings.gscSiteUrl,
      hasGa4ServiceAccount: Boolean(settings.ga4ServiceAccountJson),
      googleOauthClientId: settings.googleOauthClientId,
      hasGoogleOauthClientSecret: Boolean(settings.googleOauthClientSecret),
      hasGoogleOauthConnection: Boolean(settings.googleOauthRefreshToken),
      googleOauthEmail: settings.googleOauthEmail,
      googleOauthRedirectUri: buildGoogleOauthRedirectUri(context.request),
      // "deployment" = env vars are set (UI should hide Client ID/Secret fields).
      // "db" = admin pasted values into the DB.
      // "none" = neither configured — UI shows the fields for first-time setup.
      googleOauthClientSource: client.source,
    });
  }

  if (segments[0] === "analytics" && segments[1] === "ga4" && segments.length === 2) {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const settings = await getAnalyticsSettings(context.locals);
    const hasAuth = Boolean(settings.googleOauthRefreshToken) || Boolean(settings.ga4ServiceAccountJson);
    if (!hasAuth || !settings.ga4PropertyId) {
      return json({ configured: false });
    }
    const url = new URL(context.request.url);
    const periodParam = url.searchParams.get("period") || "7d";
    const days = periodParam === "90d" ? 90 : periodParam === "30d" ? 30 : 7;
    try {
      const { accessToken } = await getGoogleAnalyticsAccessToken(context.locals, settings);
      const data = await fetchGoogleAnalytics({
        accessToken,
        propertyId: settings.ga4PropertyId,
        days,
      });
      return json({ configured: true, ...data });
    } catch (error) {
      return json(
        {
          configured: true,
          error: error instanceof Error ? error.message : "Failed to load GA4 analytics.",
        },
        502,
      );
    }
  }

  if (segments[0] === "analytics" && segments[1] === "ga4" && segments[2] === "properties") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const settings = await getAnalyticsSettings(context.locals);
    const hasAuth = Boolean(settings.googleOauthRefreshToken) || Boolean(settings.ga4ServiceAccountJson);
    if (!hasAuth) {
      return json({ configured: false, properties: [] });
    }
    try {
      const { accessToken } = await getGoogleAnalyticsAccessToken(context.locals, settings);
      const properties = await listGoogleAnalyticsProperties(accessToken);
      return json({ configured: true, properties });
    } catch (error) {
      return json(
        {
          configured: true,
          properties: [],
          error: error instanceof Error ? error.message : "Failed to list GA4 properties.",
        },
        502,
      );
    }
  }

  if (segments[0] === "analytics" && segments[1] === "search-console" && segments.length === 2) {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const settings = await getAnalyticsSettings(context.locals);
    const hasAuth = Boolean(settings.googleOauthRefreshToken) || Boolean(settings.ga4ServiceAccountJson);
    if (!hasAuth || !settings.gscSiteUrl) {
      return json({ configured: false });
    }
    const url = new URL(context.request.url);
    const periodParam = url.searchParams.get("period") || "7d";
    const days = periodParam === "90d" ? 90 : periodParam === "30d" ? 30 : 7;
    try {
      const { accessToken } = await getGoogleAnalyticsAccessToken(context.locals, settings);
      const data = await fetchGoogleSearchConsole({
        accessToken,
        siteUrl: settings.gscSiteUrl,
        days,
      });
      return json({ configured: true, ...data });
    } catch (error) {
      return json(
        {
          configured: true,
          error: error instanceof Error ? error.message : "Failed to load Search Console data.",
        },
        502,
      );
    }
  }

  if (segments[0] === "analytics" && segments[1] === "search-console" && segments[2] === "sites") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const settings = await getAnalyticsSettings(context.locals);
    const hasAuth = Boolean(settings.googleOauthRefreshToken) || Boolean(settings.ga4ServiceAccountJson);
    if (!hasAuth) {
      return json({ configured: false, sites: [] });
    }
    try {
      const { accessToken } = await getGoogleAnalyticsAccessToken(context.locals, settings);
      const sites = await listGoogleSearchConsoleSites(accessToken);
      return json({ configured: true, sites });
    } catch (error) {
      return json(
        {
          configured: true,
          sites: [],
          error: error instanceof Error ? error.message : "Failed to list Search Console sites.",
        },
        502,
      );
    }
  }

  if (segments[0] === "auth" && segments[1] === "google" && segments[2] === "start") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const settings = await getAnalyticsSettings(context.locals);
    const client = resolveGoogleOauthClient(context.locals, settings);
    if (!client.clientId || !client.clientSecret) {
      return redirectToPath(
        context.request,
        "/admin?integrations_error=missing_oauth_client",
      );
    }
    const state = crypto.randomUUID();
    const redirectUri = buildGoogleOauthRedirectUri(context.request);
    const authzUrl = buildAuthorizationUrl({
      clientId: client.clientId,
      redirectUri,
      state,
    });
    return new Response(null, {
      status: 303,
      headers: {
        location: authzUrl,
        "set-cookie": buildStateCookie(state, 600), // 10 minutes to complete the flow
      },
    });
  }

  if (segments[0] === "auth" && segments[1] === "google" && segments[2] === "callback") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const url = new URL(context.request.url);
    const code = url.searchParams.get("code") || "";
    const stateFromGoogle = url.searchParams.get("state") || "";
    const errorParam = url.searchParams.get("error") || "";
    const expectedState = readStateCookie(context.request);

    if (errorParam) {
      return new Response(null, {
        status: 303,
        headers: {
          location: `/admin?integrations_error=${encodeURIComponent(errorParam)}`,
          "set-cookie": clearStateCookie(),
        },
      });
    }
    if (!code || !stateFromGoogle || !expectedState || stateFromGoogle !== expectedState) {
      return new Response(null, {
        status: 303,
        headers: {
          location: "/admin?integrations_error=oauth_state_mismatch",
          "set-cookie": clearStateCookie(),
        },
      });
    }

    const settings = await getAnalyticsSettings(context.locals);
    const client = resolveGoogleOauthClient(context.locals, settings);
    if (!client.clientId || !client.clientSecret) {
      return new Response(null, {
        status: 303,
        headers: {
          location: "/admin?integrations_error=missing_oauth_client",
          "set-cookie": clearStateCookie(),
        },
      });
    }

    try {
      const redirectUri = buildGoogleOauthRedirectUri(context.request);
      const result = await exchangeCodeForTokens({
        clientId: client.clientId,
        clientSecret: client.clientSecret,
        code,
        redirectUri,
      });
      await upsertAnalyticsSettings(context.locals, {
        ...settings,
        googleOauthRefreshToken: result.refreshToken,
        googleOauthEmail: result.email,
      });
      return new Response(null, {
        status: 303,
        headers: {
          location: "/admin?integrations_connected=google",
          "set-cookie": clearStateCookie(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth callback failed";
      return new Response(null, {
        status: 303,
        headers: {
          location: `/admin?integrations_error=${encodeURIComponent(message)}`,
          "set-cookie": clearStateCookie(),
        },
      });
    }
  }

  return notFound();
};

export const POST: APIRoute = async (context) => {
  const segments = getSegments(context.params.path);

  // PUBLIC: contact / generic form submissions from the public site
  if (segments[0] === "forms" && segments[1]) {
    const formType = segments[1];
    let payload: Record<string, unknown> = {};

    const contentType = context.request.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const parsed = await context.request.json();
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          payload = parsed as Record<string, unknown>;
        }
      } else {
        const form = await context.request.formData();
        for (const [key, value] of form.entries()) {
          payload[key] = typeof value === "string" ? value : String(value);
        }
      }
    } catch {
      return badRequest("Could not parse form payload.");
    }

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const subject = typeof payload.subject === "string" ? payload.subject.trim() : "";
    const message = typeof payload.message === "string" ? payload.message.trim() : "";

    if (!email && !name && !message) {
      return badRequest("Submission must include at least a name, email, or message.");
    }

    const sourcePath = typeof payload._source === "string"
      ? payload._source
      : context.request.headers.get("referer") || undefined;

    const submissionId = await createFormSubmission(context.locals, {
      email,
      formType,
      message,
      name,
      rawData: payload,
      sourcePath,
      subject,
    });

    // Best-effort notification email via Resend
    try {
      const emailSettings = await getEmailSettings(context.locals);
      if (emailSettings.resendApiKey && emailSettings.notificationEmail && emailSettings.fromEmail) {
        const niceSubject = subject || `New ${formType} form submission`;
        const lines = [
          name && `From: ${name}`,
          email && `Email: ${email}`,
          subject && `Subject: ${subject}`,
          sourcePath && `Source: ${sourcePath}`,
          "",
          message,
        ].filter(Boolean).join("\n");
        const html = lines
          .split("\n")
          .map((line) => (line ? `<p>${line.replace(/</g, "&lt;")}</p>` : "<br />"))
          .join("");
        await sendResendEmail({
          apiKey: emailSettings.resendApiKey,
          from: emailSettings.fromName
            ? `${emailSettings.fromName} <${emailSettings.fromEmail}>`
            : emailSettings.fromEmail,
          html,
          replyTo: email || undefined,
          subject: `[${formType}] ${niceSubject}`,
          text: lines,
          to: emailSettings.notificationEmail,
        });
      }
    } catch (error) {
      console.warn("Resend notification failed:", error);
      // Don't fail the form submission if email delivery fails
    }

    return json({ id: submissionId, ok: true });
  }

  if (segments[0] === "auth" && segments[1] === "login") {
    const body = await parseLoginBody(context.request);

    if (!body?.email || !body.password) {
      if (!wantsJsonResponse(context.request)) {
        return redirectToLoginError(context.request, "missing_credentials");
      }
      return badRequest("Email and password are required.");
    }

    const db = getDb(context.locals);
    if (!db) {
      return json({ error: "D1 binding is not configured." }, 500);
    }

    const user = await db
      .prepare("SELECT id, email, name, role, password_hash FROM users WHERE email = ? LIMIT 1")
      .bind(body.email.trim().toLowerCase())
      .first<{
        email: string;
        id: string;
        name: string;
        password_hash: string;
        role: string;
      }>();

    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      if (!wantsJsonResponse(context.request)) {
        return redirectToLoginError(context.request, "invalid_credentials");
      }
      return json({ error: "Invalid email or password." }, 401);
    }

    const token = await createSessionToken(user.id, getSessionSecret(context.locals));
    const sessionCookie = buildSessionCookie(token, context.request);

    if (!wantsJsonResponse(context.request)) {
      return redirectToPath(context.request, getRedirectTarget(context.request), 303, {
        "set-cookie": sessionCookie,
      });
    }

    return json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: normalizeCmsUserRole(user.role),
        },
      },
      200,
      {
        "set-cookie": sessionCookie,
      },
    );
  }

  if (segments[0] === "auth" && segments[1] === "logout") {
    return json({ ok: true }, 200, {
      "set-cookie": buildLogoutCookie(context.request),
    });
  }

  if (segments[0] === "auth" && segments[1] === "invite" && segments[2] === "accept") {
    const body = await parseJsonBody<{ name?: string; password?: string; token?: string }>(context.request);
    const token = String(body?.token || "").trim();
    const password = String(body?.password || "");
    const requestedName = String(body?.name || "").trim();

    if (!token || !password) {
      return badRequest("Invitation token and password are required.");
    }

    if (password.length < 10) {
      return badRequest("Password must be at least 10 characters.");
    }

    const invitation = await getUserInvitationByTokenHash(
      context.locals,
      await hashInvitationToken(token, getSessionSecret(context.locals)),
    );

    if (!invitation) {
      return json({ error: "Invitation not found." }, 404);
    }

    if (invitation.acceptedAt) {
      return json({ error: "This invitation has already been accepted." }, 410);
    }

    if (invitation.revokedAt) {
      return json({ error: "This invitation has been revoked." }, 410);
    }

    if (Date.parse(invitation.expiresAt) <= Date.now()) {
      return json({ error: "This invitation has expired." }, 410);
    }

    const existingUser = await getCmsUserByEmail(context.locals, invitation.email);
    if (existingUser) {
      return json({ error: "A user with this email already exists." }, 409);
    }

    const userId = await createCmsUser(context.locals, {
      email: invitation.email,
      name: requestedName || invitation.name,
      passwordHash: await hashPassword(password),
      role: invitation.role,
    });
    await upsertCmsUserFeatureVisibility(context.locals, userId, invitation.featureVisibility);
    await markUserInvitationAccepted(context.locals, invitation.id);

    const sessionToken = await createSessionToken(userId, getSessionSecret(context.locals));
    const sessionCookie = buildSessionCookie(sessionToken, context.request);

    return json(
      {
        ok: true,
        user: {
          email: invitation.email,
          id: userId,
          name: requestedName || invitation.name,
          role: invitation.role,
        },
      },
      200,
      {
        "set-cookie": sessionCookie,
      },
    );
  }

  if (segments[0] === "users" && segments[1] === "invitations" && segments.length === 2) {
    const auth = await requireOwner(context);
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const body = await parseJsonBody<{
      email?: string;
      featureVisibility?: Partial<CmsUserFeatureVisibility>;
      name?: string;
      role?: string;
    }>(context.request);
    const email = String(body?.email || "").trim().toLowerCase();
    const name = String(body?.name || "").trim();
    const role = normalizeCmsUserRole(body?.role);

    if (!email || !name) {
      return badRequest("Name and email are required.");
    }

    if (!canAssignRole(auth.user.role, role)) {
      return json({ error: "You cannot assign that role." }, 403);
    }

    const existingUser = await getCmsUserByEmail(context.locals, email);
    if (existingUser) {
      return json({ error: "That email already has access to this CMS." }, 409);
    }

    const existingInvitation = await getActiveInvitationByEmail(context.locals, email);
    if (existingInvitation) {
      return json({ error: "There is already an active invitation for that email." }, 409);
    }

    const rawToken = createInvitationToken();
    const invitation = await createUserInvitation(context.locals, {
      email,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
      featureVisibility: normalizeFeatureVisibility(body?.featureVisibility),
      invitedByUserId: auth.user.id,
      name,
      role,
      tokenHash: await hashInvitationToken(rawToken, getSessionSecret(context.locals)),
    });
    const inviteUrl = new URL("/admin/invite", context.request.url);
    inviteUrl.searchParams.set("token", rawToken);

    return json({
      invitation,
      inviteUrl: inviteUrl.toString(),
    });
  }

  if (segments[0] === "linkedin" && segments[1] === "disconnect") {
    const auth = await requireFeatureAccess(context, "linkedin");
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    await deleteLinkedInConnectionByUserId(context.locals, auth.user.id);
    return json({ ok: true });
  }

  if (segments[0] === "linkedin" && segments[1] === "target") {
    const auth = await requireFeatureAccess(context, "linkedin");
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const body = await parseJsonBody<{ targetUrn?: string }>(context.request);
    const targetUrn = String(body?.targetUrn || "").trim();
    if (!targetUrn) {
      return badRequest("Target URN is required.");
    }
    if (!targetUrn.startsWith("urn:li:person:") && !targetUrn.startsWith("urn:li:organization:")) {
      return badRequest("Invalid LinkedIn target URN.");
    }

    const existing = await getLinkedInSettings(context.locals);
    await upsertLinkedInSettings(context.locals, {
      ...existing,
      authorUrn: targetUrn.startsWith("urn:li:person:") ? targetUrn : "",
      organizationUrn: targetUrn.startsWith("urn:li:organization:") ? targetUrn : "",
    });

    return json({ ok: true });
  }

  if (segments[0] === "media" && segments[1] === "upload") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }

    let formData: FormData;
    try {
      formData = await context.request.formData();
    } catch {
      return badRequest("Could not read upload data. The request body may have been consumed.");
    }
    const file = formData.get("file");
    const sourceUrl = String(formData.get("sourceUrl") || "").trim();
    const alt = String(formData.get("alt") || "").trim();

    let buffer: ArrayBuffer;
    let contentType = "";
    let filename = "";

    if (file instanceof File) {
      buffer = await file.arrayBuffer();
      contentType = file.type;
      filename = file.name;
    } else if (sourceUrl) {
      const response = await fetch(sourceUrl);

      if (!response.ok) {
        return badRequest("Failed to fetch the source URL.");
      }

      buffer = await response.arrayBuffer();
      contentType = response.headers.get("content-type") || "";
      filename = sourceUrl.split("/").pop() || `media-${Date.now()}`;
    } else {
      return badRequest("Provide either a file upload or a source URL.");
    }

    const r2Key = `${Date.now()}-${filename.replace(/\s+/g, "-").toLowerCase()}`;
    await putMediaObject(context.locals, r2Key, buffer, { contentType });

    const record = await saveMediaRecord(context.locals, {
      filename,
      r2Key,
      sourceUrl: sourceUrl || undefined,
      alt: alt || undefined,
      mimeType: contentType || undefined,
      sizeBytes: buffer.byteLength,
    });

    return json({
      ...record,
      publicUrl: buildMediaUrl(context.locals, filename),
    });
  }

  if (segments[0] === "ai" && segments[1] === "posts" && segments[2] === "titles") {
    const auth = await requireFeatureAccess(context, "ai-blog-tools");
    if (auth.response) {
      return auth.response;
    }

    const body = await parseJsonBody<{
      audience?: string;
      count?: number;
      goal?: string;
      topic?: string;
    }>(context.request);

    if (!body?.topic?.trim()) {
      return badRequest("A topic is required.");
    }

    try {
      return json(await generateAiPostTitleIdeas(context.locals, {
        topic: body.topic,
        audience: body.audience,
        goal: body.goal,
        count: body.count,
      }));
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Failed to generate title ideas." }, 400);
    }
  }

  if (segments[0] === "ai" && segments[1] === "posts" && segments[2] === "generate") {
    const auth = await requireFeatureAccess(context, "ai-blog-tools");
    if (auth.response) {
      return auth.response;
    }

    const body = await parseJsonBody<{
      audience?: string;
      generateImage?: boolean;
      goal?: string;
      imagePrompt?: string;
      selectedTitle?: string;
      topic?: string;
    }>(context.request);

    if (!body?.topic?.trim()) {
      return badRequest("A topic is required.");
    }

    try {
      return json(await generateAiPostDraft(context.locals, {
        topic: body.topic,
        audience: body.audience,
        goal: body.goal,
        imagePrompt: body.imagePrompt,
        selectedTitle: body.selectedTitle,
        generateImage: body.generateImage,
      }));
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Failed to generate AI post." }, 400);
    }
  }

  if (segments[0] === "linkedin" && segments[1] === "posts" && segments[2] === "share") {
    const auth = await requireFeatureAccess(context, "linkedin");
    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const body = await parseJsonBody<{ slug?: string; targetUrn?: string }>(context.request);
    const slug = String(body?.slug || "").trim();
    const targetUrnInput = String(body?.targetUrn || "").trim();

    if (!slug) {
      return badRequest("Post slug is required.");
    }
    if (
      targetUrnInput
      && !targetUrnInput.startsWith("urn:li:person:")
      && !targetUrnInput.startsWith("urn:li:organization:")
    ) {
      return badRequest("Invalid LinkedIn target URN.");
    }

    const connection = await getLinkedInConnectionByUserId(context.locals, auth.user.id);
    if (!connection?.accessToken || !connection.linkedInSub) {
      return badRequest("LinkedIn is not connected for this account.");
    }

    const post = await getPostBySlug(context.locals, slug, { includeUnpublished: true });
    if (!post) {
      return notFound();
    }
    if (!post.published) {
      return badRequest("Publish the post before sharing to LinkedIn.");
    }

    const siteSettings = await getSiteSettings(context.locals);
    const articleUrl = `${String(siteSettings.siteUrl || "").replace(/\/+$/, "")}/blog/${post.slug}`;

    try {
      const apiVersions = buildLinkedInApiVersionCandidates(
        getLinkedInApiVersion(context.locals),
      );
      const linkedInSettings = await getLinkedInSettings(context.locals);
      const preferredAuthorUrn = targetUrnInput
        || linkedInSettings.organizationUrn?.trim()
        || linkedInSettings.authorUrn?.trim()
        || toLinkedInPersonUrn(connection.linkedInSub);

      const linkedInPost = await createLinkedInPost({
        accessToken: connection.accessToken,
        apiVersions,
        authorUrn: preferredAuthorUrn,
        title: post.title,
        excerpt: post.excerpt,
        articleUrl,
      });

      return json({ ok: true, linkedInPostId: linkedInPost.id, articleUrl });
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : "Failed to share on LinkedIn." }, 400);
    }
  }

  return notFound();
};

export const OPTIONS: APIRoute = async (context) => {
  const segments = getSegments(context.params.path);

  if (segments[0] === "auth" && (segments[1] === "login" || segments[1] === "logout")) {
    return new Response(null, {
      status: 204,
      headers: {
        allow: "POST, OPTIONS",
      },
    });
  }

  return notFound();
};

export const PUT: APIRoute = async (context) => {
  const segments = getSegments(context.params.path);
  const auth = await requireAdmin(context);

  if (auth.response) {
    return auth.response;
  }

  if (segments[0] === "settings") {
    const body = await parseJsonBody(context.request);

    if (!body) {
      return badRequest("Invalid settings payload.");
    }

    await upsertSiteSettings(context.locals, body as Awaited<ReturnType<typeof getSiteSettings>>);
    return json({ ok: true });
  }

  if (segments[0] === "feature-flags") {
    const superAdminAuth = await requireSuperAdmin(context);
    if (superAdminAuth.response) {
      return superAdminAuth.response;
    }

    const body = await parseJsonBody<{ showAiDashboard?: boolean; showBlog?: boolean }>(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid feature visibility payload.");
    }

    await upsertCmsFeatureFlags(context.locals, {
      showAiDashboard: Boolean(body.showAiDashboard),
      showBlog: Boolean(body.showBlog),
    });
    return json({ ok: true });
  }

  if (segments[0] === "users" && segments[2] === "features") {
    const superAdminAuth = await requireSuperAdmin(context);
    if (superAdminAuth.response || !superAdminAuth.user) {
      return superAdminAuth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const targetUser = await getCmsUserById(context.locals, segments[1]);

    if (!targetUser) {
      return notFound();
    }

    if (isSuperAdminRole(targetUser.role)) {
      return json({ error: "Super admin feature access is always enabled." }, 403);
    }

    const body = await parseJsonBody<{
      showAiBlogTools?: boolean;
      showAiSettings?: boolean;
      showLinkedIn?: boolean;
    }>(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid user feature visibility payload.");
    }

    const updatedUser = await upsertCmsUserFeatureVisibility(context.locals, targetUser.id, {
      showAiSettings: body.showAiSettings !== false,
      showAiBlogTools: body.showAiBlogTools !== false,
      showLinkedIn: body.showLinkedIn !== false,
    });

    return json({ ok: true, user: updatedUser });
  }

  if (segments[0] === "users" && segments[1]) {
    const ownerAuth = await requireOwner(context);
    if (ownerAuth.response || !ownerAuth.user) {
      return ownerAuth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const body = await parseJsonBody<{ role?: string }>(context.request);
    const nextRole = normalizeCmsUserRole(body?.role);
    const targetUser = await getCmsUserById(context.locals, segments[1]);

    if (!targetUser) {
      return notFound();
    }

    if (!canUpdateUserRole({
      actorId: ownerAuth.user.id,
      actorRole: ownerAuth.user.role,
      nextRole,
      targetId: targetUser.id,
      targetRole: targetUser.role,
    })) {
      return json({ error: "You cannot change that user's role." }, 403);
    }

    const updatedUser = await updateCmsUserRole(context.locals, targetUser.id, nextRole);
    return json({ ok: true, user: updatedUser });
  }

  if (segments[0] === "ai-settings") {
    const featureAuth = await requireFeatureAccess(context, "ai-settings");
    if (featureAuth.response) {
      return featureAuth.response;
    }

    const body = await parseJsonBody(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid AI settings payload.");
    }

    const existing = await getAiSettings(context.locals);
    const next = body as Record<string, unknown>;
    const nextApiKey =
      next.clearApiKey === true
        ? ""
        : typeof next.apiKey === "string" && next.apiKey.trim()
          ? next.apiKey.trim()
          : existing.apiKey;

    await upsertAiSettings(context.locals, {
      ...existing,
      ...(next as Partial<Awaited<ReturnType<typeof getAiSettings>>>),
      apiKey: nextApiKey,
    });
    return json({ ok: true });
  }

  if (segments[0] === "linkedin-settings") {
    const body = await parseJsonBody(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid LinkedIn settings payload.");
    }

    const existing = await getLinkedInSettings(context.locals);
    const next = body as Record<string, unknown>;
    const nextClientSecret =
      next.clearClientSecret === true
        ? ""
        : typeof next.clientSecret === "string" && next.clientSecret.trim()
          ? next.clientSecret.trim()
          : existing.clientSecret;
    const nextAccessToken =
      next.clearAccessToken === true
        ? ""
        : typeof next.accessToken === "string" && next.accessToken.trim()
          ? next.accessToken.trim()
          : existing.accessToken;

    await upsertLinkedInSettings(context.locals, {
      ...existing,
      ...(next as Partial<Awaited<ReturnType<typeof getLinkedInSettings>>>),
      clientSecret: nextClientSecret,
      accessToken: nextAccessToken,
    });
    return json({ ok: true });
  }

  if (segments[0] === "pages") {
    const body = await parseJsonBody(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid page payload.");
    }

    const slug = segments.length >= 2 ? segments.slice(1).join("/") : "";

    await upsertPage(context.locals, {
      ...(body as Record<string, unknown>),
      slug,
    } as CmsPageRecord);

    return json({ ok: true });
  }

  if (segments[0] === "posts" && segments.length >= 2) {
    const featureAuth = await requireFeatureAccess(context, "blog");
    if (featureAuth.response) {
      return featureAuth.response;
    }

    const body = await parseJsonBody(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid post payload.");
    }

    await upsertPost(context.locals, {
      ...(body as Record<string, unknown>),
      slug: segments.slice(1).join("/"),
    } as CmsPostRecord);

    return json({ ok: true });
  }

  if (segments[0] === "products" && segments.length >= 2) {
    const body = await parseJsonBody(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid product payload.");
    }

    await upsertCatalogProduct(context.locals, {
      ...(body as Record<string, unknown>),
      slug: segments.slice(1).join("/"),
    } as CmsProductRecord);

    return json({ ok: true });
  }

  if (segments[0] === "media" && segments[1]) {
    const body = await parseJsonBody<{ alt?: string }>(context.request);
    const existing = await getMediaById(context.locals, segments[1]);

    if (!existing) {
      return notFound();
    }

    await updateMediaAlt(context.locals, segments[1], typeof body?.alt === "string" ? body.alt : "");
    return json({ ok: true });
  }

  if (segments[0] === "content-items" && segments[1] && segments[2]) {
    const body = await parseJsonBody<{
      data?: Record<string, unknown>;
      published?: boolean;
      slug?: string;
    }>(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid content item payload.");
    }

    const type = segments[1];
    const slug = (typeof body.slug === "string" && body.slug) || segments[2];

    const stored = await upsertContentItem(context.locals, {
      data: (body.data && typeof body.data === "object") ? body.data : {},
      published: Boolean(body.published),
      slug,
      type,
    });

    return json(stored);
  }

  if (segments[0] === "integrations" && segments[1] === "analytics") {
    const body = await parseJsonBody<{
      ga4PropertyId?: string;
      ga4ServiceAccountJson?: string;
      gscSiteUrl?: string;
      googleOauthClientId?: string;
      googleOauthClientSecret?: string;
    }>(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid analytics settings payload.");
    }

    const existing = await getAnalyticsSettings(context.locals);
    const next = {
      ga4PropertyId: typeof body.ga4PropertyId === "string"
        ? body.ga4PropertyId.trim()
        : existing.ga4PropertyId,
      ga4ServiceAccountJson: typeof body.ga4ServiceAccountJson === "string"
        ? body.ga4ServiceAccountJson.trim()
        : existing.ga4ServiceAccountJson,
      gscSiteUrl: typeof body.gscSiteUrl === "string"
        ? body.gscSiteUrl.trim()
        : existing.gscSiteUrl,
      googleOauthClientId: typeof body.googleOauthClientId === "string"
        ? body.googleOauthClientId.trim()
        : existing.googleOauthClientId,
      googleOauthClientSecret: typeof body.googleOauthClientSecret === "string"
        ? body.googleOauthClientSecret.trim()
        : existing.googleOauthClientSecret,
      googleOauthRefreshToken: existing.googleOauthRefreshToken,
      googleOauthEmail: existing.googleOauthEmail,
    };

    await upsertAnalyticsSettings(context.locals, next);

    return json({
      ga4PropertyId: next.ga4PropertyId,
      gscSiteUrl: next.gscSiteUrl,
      hasGa4ServiceAccount: Boolean(next.ga4ServiceAccountJson),
      googleOauthClientId: next.googleOauthClientId,
      hasGoogleOauthClientSecret: Boolean(next.googleOauthClientSecret),
      hasGoogleOauthConnection: Boolean(next.googleOauthRefreshToken),
      googleOauthEmail: next.googleOauthEmail,
    });
  }

  if (segments[0] === "auth" && segments[1] === "google" && segments[2] === "disconnect") {
    const auth = await requireAdmin(context);
    if (auth.response) {
      return auth.response;
    }
    const existing = await getAnalyticsSettings(context.locals);
    if (existing.googleOauthRefreshToken) {
      // Best-effort revoke against Google; the local clear runs even if this fails.
      await revokeRefreshToken(existing.googleOauthRefreshToken);
    }
    await upsertAnalyticsSettings(context.locals, {
      ...existing,
      googleOauthRefreshToken: "",
      googleOauthEmail: "",
    });
    return json({ disconnected: true });
  }

  if (segments[0] === "email" && segments[1] === "settings") {
    const body = await parseJsonBody<{
      fromEmail?: string;
      fromName?: string;
      notificationEmail?: string;
      resendApiKey?: string;
    }>(context.request);

    if (!body || typeof body !== "object") {
      return badRequest("Invalid email settings payload.");
    }

    const existing = await getEmailSettings(context.locals);
    const next = {
      fromEmail: typeof body.fromEmail === "string" ? body.fromEmail.trim() : existing.fromEmail,
      fromName: typeof body.fromName === "string" ? body.fromName.trim() : existing.fromName,
      notificationEmail: typeof body.notificationEmail === "string"
        ? body.notificationEmail.trim()
        : existing.notificationEmail,
      resendApiKey: typeof body.resendApiKey === "string"
        ? body.resendApiKey.trim()
        : existing.resendApiKey,
    };

    await upsertEmailSettings(context.locals, next);

    return json({
      fromEmail: next.fromEmail,
      fromName: next.fromName,
      hasResendApiKey: Boolean(next.resendApiKey),
      notificationEmail: next.notificationEmail,
    });
  }

  return notFound();
};

export const PATCH: APIRoute = async (context) => {
  const segments = getSegments(context.params.path);
  const auth = await requireAdmin(context);
  if (auth.response) {
    return auth.response;
  }

  if (segments[0] === "email" && segments[1] === "submissions" && segments[2]) {
    const existing = await getFormSubmissionById(context.locals, segments[2]);
    if (!existing) {
      return notFound();
    }
    const body = await parseJsonBody<{ archived?: boolean }>(context.request);
    if (typeof body?.archived === "boolean") {
      await archiveFormSubmission(context.locals, segments[2], body.archived);
    }
    return json({ ok: true });
  }

  return notFound();
};

export const DELETE: APIRoute = async (context) => {
  const segments = getSegments(context.params.path);

  if (segments[0] === "users" && segments[1] === "invitations" && segments[2]) {
    const auth = await requireOwner(context);

    if (auth.response) {
      return auth.response;
    }

    await revokeUserInvitation(context.locals, segments[2]);
    return json({ ok: true });
  }

  if (segments[0] === "users" && segments[1]) {
    const auth = await requireOwner(context);

    if (auth.response || !auth.user) {
      return auth.response ?? json({ error: "Unauthorized" }, 401);
    }

    const targetUser = await getCmsUserById(context.locals, segments[1]);

    if (!targetUser) {
      return notFound();
    }

    if (!canDeleteUser({
      actorId: auth.user.id,
      actorRole: auth.user.role,
      targetId: targetUser.id,
      targetRole: targetUser.role,
    })) {
      return json({ error: "You cannot delete that user." }, 403);
    }

    await deleteLinkedInConnectionByUserId(context.locals, targetUser.id);
    await deleteCmsUser(context.locals, targetUser.id);
    return json({ ok: true });
  }

  const auth = await requireAdmin(context);

  if (auth.response) {
    return auth.response;
  }

  if (segments[0] === "posts" && segments.length >= 2) {
    const featureAuth = await requireFeatureAccess(context, "blog");
    if (featureAuth.response) {
      return featureAuth.response;
    }

    await deletePostBySlug(context.locals, segments.slice(1).join("/"));
    return json({ ok: true });
  }

  if (segments[0] === "products" && segments.length >= 2) {
    await deleteCatalogProductBySlug(context.locals, segments.slice(1).join("/"));
    return json({ ok: true });
  }

  if (segments[0] === "media" && segments[1]) {
    const existing = await getMediaById(context.locals, segments[1]);
    if (!existing) {
      return notFound();
    }
    await deleteMediaRecord(context.locals, segments[1]);
    return json({ ok: true });
  }

  if (segments[0] === "content-items" && segments[1] && segments[2]) {
    const existing = await getContentItem(context.locals, segments[1], segments[2]);
    if (!existing) {
      return notFound();
    }
    await deleteContentItem(context.locals, segments[1], segments[2]);
    return json({ ok: true });
  }

  if (segments[0] === "email" && segments[1] === "submissions" && segments[2]) {
    const existing = await getFormSubmissionById(context.locals, segments[2]);
    if (!existing) {
      return notFound();
    }
    await deleteFormSubmissionById(context.locals, segments[2]);
    return json({ ok: true });
  }

  return notFound();
};
