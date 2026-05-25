import { isSuperAdminRole, normalizeCmsUserRole, type CmsUserRole } from "./auth";
import {
  DEFAULT_AI_SETTINGS,
  DEFAULT_CMS_FEATURE_FLAGS,
  DEFAULT_CMS_USER_FEATURE_VISIBILITY,
  DEFAULT_LINKEDIN_SETTINGS,
  DEFAULT_SITE_SETTINGS,
  LEGACY_BLOG_PROMPT_TEMPLATE,
  LEGACY_BLOG_PROMPT_TEMPLATE_WITH_GENERIC_INTERNAL_LINKS,
  LEGACY_IMAGE_MODEL,
  LEGACY_IMAGE_PROMPT_TEMPLATE,
  type AiSettings,
  type CmsFeatureFlags,
  type CmsUserFeatureVisibility,
  type LinkedInSettings,
  type SiteSettings,
} from "./defaults";
import {
  buildAllowedInternalOrigins,
  makeInternalLinkPathSet,
  normalizeCandidateInternalHref,
  sanitizeInternalLinksInHtml,
  type InternalLinkOption,
} from "./internal-links";
import { getAiSettingsEncryptionSecret, getDb, getMediaBucket, getMediaPublicBaseUrl } from "./runtime";

export interface CmsPageRecord {
  contentHtml: string;
  description: string;
  lang: string;
  published: boolean;
  schema?: unknown;
  slug: string;
  stylesheets: string[];
  title: string;
}

export interface CmsPostRecord {
  authorName: string;
  authorRole: string;
  authorSlug?: string;
  categories: Array<{ label: string }>;
  contentHtml: string;
  coverImageAlt?: string;
  coverImageUrl?: string;
  excerpt: string;
  featured: boolean;
  primaryCategory: string;
  published: boolean;
  publishedAt: string;
  readTime?: string;
  seoDescription?: string;
  seoTitle?: string;
  slug: string;
  title: string;
}

export interface CmsProductRecord {
  bestFor: string[];
  categoryLabel: string;
  categorySlug: string;
  contentHtml: string;
  heroImageAlt?: string;
  heroImageUrl: string;
  isFrontPage: boolean;
  metaDescription: string;
  metaTitle: string;
  name: string;
  overview: string;
  price?: number;
  priceLabel?: string;
  productImages: CmsProductImageRecord[];
  published: boolean;
  shortDescription: string;
  slug: string;
  specNotes: string[];
}

export interface CmsProductImageRecord {
  alt?: string;
  label?: string;
  sortOrder: number;
  url: string;
}

export interface CmsMediaRecord {
  alt?: string;
  filename: string;
  id: string;
  mimeType?: string;
  publicUrl: string;
  r2Key: string;
  sizeBytes?: number;
  sourceUrl?: string;
}

export interface LinkedInConnectionRecord {
  accessToken: string;
  expiresAt?: string;
  linkedInEmail?: string;
  linkedInName?: string;
  linkedInSub: string;
  scope?: string;
  userId: string;
}

export interface CmsUserRecord {
  createdAt: string;
  email: string;
  featureVisibility: CmsUserFeatureVisibility;
  id: string;
  name: string;
  role: CmsUserRole;
  updatedAt: string;
}

export interface CmsUserInvitationRecord {
  acceptedAt?: string;
  createdAt: string;
  email: string;
  expiresAt: string;
  featureVisibility: CmsUserFeatureVisibility;
  id: string;
  invitedByUserId: string;
  name: string;
  revokedAt?: string;
  role: CmsUserRole;
  tokenHash: string;
  updatedAt: string;
}

let ensuredCmsFeatureFlagsTable = false;
let ensuredSiteSettingsColumns = false;
let ensuredUserFeatureVisibilityTable = false;

function parseJson<T>(value: string | null | undefined, fallback: T) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeProductImages(
  heroImageUrl: string | undefined,
  heroImageAlt: string | undefined,
  productImages: CmsProductImageRecord[] | undefined,
) {
  const seen = new Set<string>();
  const normalized: CmsProductImageRecord[] = [];

  const pushImage = (
    image:
      | CmsProductImageRecord
      | {
          url?: string;
          alt?: string;
          label?: string;
          sortOrder?: number;
        },
    fallbackSortOrder = normalized.length,
  ) => {
    const url = String(image.url || "").trim();

    if (!url || seen.has(url)) {
      return;
    }

    seen.add(url);
    normalized.push({
      url,
      alt: image.alt?.trim() || undefined,
      label: image.label?.trim() || undefined,
      sortOrder: Number.isFinite(Number(image.sortOrder)) ? Number(image.sortOrder) : fallbackSortOrder,
    });
  };

  if (heroImageUrl) {
    pushImage({
      url: heroImageUrl,
      alt: heroImageAlt,
      sortOrder: -1,
    }, -1);
  }

  (productImages || [])
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((image, index) => pushImage(image, index));

  return normalized.map((image, index) => ({
    ...image,
    sortOrder: index,
  }));
}

function parseProductImages(value: unknown) {
  const parsed = parseJson<unknown[]>(typeof value === "string" ? value : "[]", []);

  return parsed
    .map((item, index) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const entry = item as Record<string, unknown>;
      const url = String(entry.url || "").trim();

      if (!url) {
        return null;
      }

      return {
        url,
        alt: entry.alt ? String(entry.alt) : undefined,
        label: entry.label ? String(entry.label) : undefined,
        sortOrder: Number.isFinite(Number(entry.sortOrder ?? entry.sort_order))
          ? Number(entry.sortOrder ?? entry.sort_order)
          : index,
      } satisfies CmsProductImageRecord;
    })
    .filter(Boolean) as CmsProductImageRecord[];
}

let ensuredProductImagesColumn = false;
let ensuredUserInvitationsTable = false;

async function ensureProductImagesColumn(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db || ensuredProductImagesColumn) {
    return;
  }

  try {
    await db
      .prepare("ALTER TABLE products ADD COLUMN product_images_json TEXT NOT NULL DEFAULT '[]'")
      .run();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (!/duplicate column|already exists|duplicate/i.test(message)) {
      console.warn("ensureProductImagesColumn failed:", error);
    }
  }

  ensuredProductImagesColumn = true;
}

async function ensureUserInvitationsTable(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db || ensuredUserInvitationsTable) {
    return;
  }

  try {
    await db
      .prepare(`CREATE TABLE IF NOT EXISTS user_invitations (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'editor',
        token_hash TEXT NOT NULL UNIQUE,
        invited_by_user_id TEXT NOT NULL,
        show_ai_settings INTEGER NOT NULL DEFAULT 1,
        show_ai_blog_tools INTEGER NOT NULL DEFAULT 1,
        show_linkedin INTEGER NOT NULL DEFAULT 1,
        expires_at TEXT NOT NULL,
        accepted_at TEXT,
        revoked_at TEXT,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`)
      .run();
    await db
      .prepare("CREATE INDEX IF NOT EXISTS idx_user_invitations_email ON user_invitations(email)")
      .run();
    await db
      .prepare("CREATE INDEX IF NOT EXISTS idx_user_invitations_token_hash ON user_invitations(token_hash)")
      .run();
    const columns = [
      ["show_ai_settings", "INTEGER NOT NULL DEFAULT 1"],
      ["show_ai_blog_tools", "INTEGER NOT NULL DEFAULT 1"],
      ["show_linkedin", "INTEGER NOT NULL DEFAULT 1"],
    ] as const;

    for (const [column, type] of columns) {
      try {
        await db.prepare(`ALTER TABLE user_invitations ADD COLUMN ${column} ${type}`).run();
      } catch (columnError) {
        const message = columnError instanceof Error ? columnError.message : String(columnError);

        if (!/duplicate column|already exists|duplicate/i.test(message)) {
          console.warn(`ensureUserInvitationsTable failed for ${column}:`, columnError);
        }
      }
    }
  } catch (error) {
    console.warn("ensureUserInvitationsTable failed:", error);
  }

  ensuredUserInvitationsTable = true;
}

async function ensureCmsFeatureFlagsTable(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db || ensuredCmsFeatureFlagsTable) {
    return;
  }

  try {
    await db
      .prepare(`CREATE TABLE IF NOT EXISTS cms_feature_flags (
        id TEXT PRIMARY KEY DEFAULT 'default',
        show_ai_dashboard INTEGER NOT NULL DEFAULT 0,
        show_blog INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`)
      .run();
  } catch (error) {
    console.warn("ensureCmsFeatureFlagsTable failed:", error);
  }

  ensuredCmsFeatureFlagsTable = true;
}

async function ensureUserFeatureVisibilityTable(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db || ensuredUserFeatureVisibilityTable) {
    return;
  }

  try {
    await db
      .prepare(`CREATE TABLE IF NOT EXISTS user_feature_visibility (
        user_id TEXT PRIMARY KEY,
        show_ai_settings INTEGER NOT NULL DEFAULT 1,
        show_ai_blog_tools INTEGER NOT NULL DEFAULT 1,
        show_linkedin INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`)
      .run();
  } catch (error) {
    console.warn("ensureUserFeatureVisibilityTable failed:", error);
  }

  ensuredUserFeatureVisibilityTable = true;
}

async function ensureSiteSettingsColumns(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db || ensuredSiteSettingsColumns) {
    return;
  }

  const columns = [
    ["favicon_url", "TEXT"],
    ["apple_touch_icon_url", "TEXT"],
    ["social_share_title", "TEXT"],
    ["social_share_description", "TEXT"],
    ["theme_color", "TEXT"],
  ] as const;

  for (const [column, type] of columns) {
    try {
      await db.prepare(`ALTER TABLE site_settings ADD COLUMN ${column} ${type}`).run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      if (!/duplicate column|already exists|duplicate/i.test(message)) {
        console.warn(`ensureSiteSettingsColumns failed for ${column}:`, error);
      }
    }
  }

  ensuredSiteSettingsColumns = true;
}

function normalizeCmsUserFeatureVisibility(
  value: Partial<CmsUserFeatureVisibility> | null | undefined,
): CmsUserFeatureVisibility {
  return {
    showAiBlogTools: value?.showAiBlogTools !== false,
    showAiSettings: value?.showAiSettings !== false,
    showLinkedIn: value?.showLinkedIn !== false,
  };
}

function dbBoolean(value: unknown, fallback = true) {
  if (value == null) {
    return fallback;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  const normalized = String(value).trim().toLowerCase();
  return normalized !== "0" && normalized !== "false";
}

function mapUserFeatureVisibilityRow(
  row: Record<string, unknown>,
  role: CmsUserRole,
): CmsUserFeatureVisibility {
  if (isSuperAdminRole(role)) {
    return DEFAULT_CMS_USER_FEATURE_VISIBILITY;
  }

  return normalizeCmsUserFeatureVisibility({
    showAiSettings: dbBoolean(row.show_ai_settings),
    showAiBlogTools: dbBoolean(row.show_ai_blog_tools),
    showLinkedIn: dbBoolean(row.show_linkedin),
  });
}

function mapUserRow(row: Record<string, unknown>): CmsUserRecord {
  const role = normalizeCmsUserRole(String(row.role || ""));

  return {
    id: String(row.id || ""),
    email: String(row.email || ""),
    name: String(row.name || ""),
    role,
    featureVisibility: mapUserFeatureVisibilityRow(row, role),
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mapUserInvitationRow(row: Record<string, unknown>): CmsUserInvitationRecord {
  const role = normalizeCmsUserRole(String(row.role || ""));

  return {
    id: String(row.id || ""),
    email: String(row.email || ""),
    name: String(row.name || ""),
    role,
    tokenHash: String(row.token_hash || ""),
    invitedByUserId: String(row.invited_by_user_id || ""),
    featureVisibility: mapUserFeatureVisibilityRow(row, role),
    expiresAt: String(row.expires_at || ""),
    acceptedAt: row.accepted_at ? String(row.accepted_at) : undefined,
    revokedAt: row.revoked_at ? String(row.revoked_at) : undefined,
    createdAt: String(row.created_at || ""),
    updatedAt: String(row.updated_at || ""),
  };
}

function mergeAiSettingsDefaults(
  settings: Omit<AiSettings, "apiKey" | "provider" | "defaultBrandPrompt"> & {
    apiKey: string;
    defaultBrandPrompt: string;
    provider: string;
  },
): AiSettings {
  return {
    provider: settings.provider || DEFAULT_AI_SETTINGS.provider,
    apiKey: settings.apiKey,
    defaultBrandPrompt: settings.defaultBrandPrompt || DEFAULT_AI_SETTINGS.defaultBrandPrompt,
    imageGeneration: {
      ...DEFAULT_AI_SETTINGS.imageGeneration,
      ...(settings.imageGeneration || {}),
    },
    blogGeneration: {
      ...DEFAULT_AI_SETTINGS.blogGeneration,
      ...(settings.blogGeneration || {}),
    },
    altTextGeneration: {
      ...DEFAULT_AI_SETTINGS.altTextGeneration,
      ...(settings.altTextGeneration || {}),
    },
  };
}

function mergeLinkedInSettingsDefaults(
  settings: Partial<LinkedInSettings>,
): LinkedInSettings {
  return {
    ...DEFAULT_LINKEDIN_SETTINGS,
    ...settings,
  };
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function toBase64(value: ArrayBuffer | Uint8Array) {
  const bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
  return Buffer.from(bytes).toString("base64");
}

function fromBase64(value: string) {
  return Uint8Array.from(Buffer.from(value, "base64"));
}

async function deriveEncryptionKey(secret: string) {
  const digest = await crypto.subtle.digest("SHA-256", textEncoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function encryptStoredSecret(value: string, secret: string) {
  if (!value) {
    return "";
  }

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveEncryptionKey(secret);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    textEncoder.encode(value),
  );

  return `enc:v1:${toBase64(iv)}:${toBase64(ciphertext)}`;
}

async function decryptStoredSecret(value: string, secret: string) {
  if (!value) {
    return "";
  }

  if (!value.startsWith("enc:v1:")) {
    return value;
  }

  const [, , ivBase64, ciphertextBase64] = value.split(":");

  if (!ivBase64 || !ciphertextBase64) {
    return "";
  }

  try {
    const key = await deriveEncryptionKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: fromBase64(ivBase64) },
      key,
      fromBase64(ciphertextBase64),
    );

    return textDecoder.decode(plaintext);
  } catch (error) {
    console.warn("decryptStoredSecret failed:", error);
    return "";
  }
}

function normalizeSlug(value: string) {
  if (!value || value === "/") {
    return "";
  }

  return value.replace(/^\/+|\/+$/g, "");
}

function pathForPageSlug(slug: string) {
  const normalized = normalizeSlug(slug);
  return normalized ? `/${normalized}` : "/";
}

function addAllowedInternalLink(
  map: Map<string, InternalLinkOption>,
  href: string,
  label: string,
  allowedOrigins: string[],
) {
  const normalized = normalizeCandidateInternalHref(href, allowedOrigins);

  if (!normalized) {
    return;
  }

  if (!map.has(normalized.path)) {
    map.set(normalized.path, {
      href: normalized.path,
      label: label.trim() || normalized.path,
    });
  }
}

function sanitizePostRecordContent(
  post: CmsPostRecord,
  context: { allowedOrigins: string[]; allowedPaths: Set<string> },
) {
  const sanitized = sanitizeInternalLinksInHtml(
    post.contentHtml,
    context.allowedPaths,
    context.allowedOrigins,
  );

  if (sanitized.html === post.contentHtml) {
    return post;
  }

  return {
    ...post,
    contentHtml: sanitized.html,
  } satisfies CmsPostRecord;
}

function mapPageRow(row: Record<string, unknown>): CmsPageRecord {
  return {
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    description: String(row.description || ""),
    lang: String(row.lang || "en"),
    stylesheets: parseJson<string[]>(String(row.stylesheets_json || "[]"), []),
    contentHtml: String(row.content_html || ""),
    schema: row.schema_json ? parseJson<unknown>(String(row.schema_json), null) : undefined,
    published: Boolean(row.published),
  };
}

function mapPostRow(row: Record<string, unknown>): CmsPostRecord {
  return {
    slug: String(row.slug || ""),
    title: String(row.title || ""),
    excerpt: String(row.excerpt || ""),
    contentHtml: String(row.content_html || ""),
    coverImageUrl: row.cover_image_url ? String(row.cover_image_url) : undefined,
    coverImageAlt: row.cover_image_alt ? String(row.cover_image_alt) : undefined,
    featured: Boolean(row.featured),
    published: Boolean(row.published),
    publishedAt: String(row.published_at || ""),
    readTime: row.read_time ? String(row.read_time) : undefined,
    authorName: String(row.author_name || "Clastro Editor"),
    authorRole: String(row.author_role || "CMS Demo Author"),
    authorSlug: row.author_slug ? String(row.author_slug) : undefined,
    primaryCategory: String(row.primary_category || "CMS"),
    categories: parseJson<Array<{ label: string }>>(String(row.categories_json || "[]"), []),
    seoTitle: row.seo_title ? String(row.seo_title) : undefined,
    seoDescription: row.seo_description ? String(row.seo_description) : undefined,
  };
}

function mapProductRow(row: Record<string, unknown>): CmsProductRecord {
  const productImages = normalizeProductImages(
    row.hero_image_url ? String(row.hero_image_url) : undefined,
    row.hero_image_alt ? String(row.hero_image_alt) : undefined,
    parseProductImages(row.product_images_json),
  );
  const heroImage = productImages[0];

  return {
    slug: String(row.slug || ""),
    name: String(row.name || ""),
    price: row.price == null ? undefined : Number(row.price),
    priceLabel: row.price_label ? String(row.price_label) : undefined,
    heroImageUrl: heroImage?.url || String(row.hero_image_url || ""),
    heroImageAlt: heroImage?.alt || (row.hero_image_alt ? String(row.hero_image_alt) : undefined),
    shortDescription: String(row.short_description || ""),
    isFrontPage: Boolean(row.is_front_page),
    metaTitle: String(row.meta_title || ""),
    metaDescription: String(row.meta_description || ""),
    categorySlug: String(row.category_slug || ""),
    categoryLabel: String(row.category_label || ""),
    overview: String(row.overview || ""),
    bestFor: parseJson<string[]>(String(row.best_for_json || "[]"), []),
    specNotes: parseJson<string[]>(String(row.spec_notes_json || "[]"), []),
    contentHtml: String(row.content_html || ""),
    productImages,
    published: Boolean(row.published),
  };
}

function mapMediaRow(row: Record<string, unknown>): CmsMediaRecord {
  return {
    id: String(row.id || ""),
    filename: String(row.filename || ""),
    r2Key: String(row.r2_key || ""),
    publicUrl: String(row.public_url || ""),
    sourceUrl: row.source_url ? String(row.source_url) : undefined,
    alt: row.alt ? String(row.alt) : undefined,
    mimeType: row.mime_type ? String(row.mime_type) : undefined,
    sizeBytes: row.size_bytes ? Number(row.size_bytes) : undefined,
  };
}

export async function listCmsUsers(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db) {
    return [] as CmsUserRecord[];
  }

  await ensureUserFeatureVisibilityTable(locals);

  const result = await db
    .prepare(
      `SELECT
         users.id,
         users.email,
         users.name,
         users.role,
         users.created_at,
         users.updated_at,
         user_feature_visibility.show_ai_settings,
         user_feature_visibility.show_ai_blog_tools,
         user_feature_visibility.show_linkedin
       FROM users
       LEFT JOIN user_feature_visibility
         ON user_feature_visibility.user_id = users.id
       ORDER BY
         CASE
           WHEN lower(users.role) IN ('super_admin', 'super-admin', 'owner', 'master') THEN 0
           WHEN lower(users.role) IN ('site_owner', 'site-owner', 'admin') THEN 1
           WHEN lower(users.role) = 'editor' THEN 2
           WHEN lower(users.role) = 'collaborator' THEN 3
           ELSE 4
         END,
         users.name COLLATE NOCASE ASC,
         users.email COLLATE NOCASE ASC`,
    )
    .all();

  return (result.results || []).map((row) => mapUserRow(row as Record<string, unknown>));
}

export async function getCmsUserByEmail(locals: App.Locals | undefined, email: string) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  await ensureUserFeatureVisibilityTable(locals);

  const row = await db
    .prepare(
      `SELECT
         users.id,
         users.email,
         users.name,
         users.role,
         users.created_at,
         users.updated_at,
         user_feature_visibility.show_ai_settings,
         user_feature_visibility.show_ai_blog_tools,
         user_feature_visibility.show_linkedin
       FROM users
       LEFT JOIN user_feature_visibility
         ON user_feature_visibility.user_id = users.id
       WHERE users.email = ?
       LIMIT 1`,
    )
    .bind(email.trim().toLowerCase())
    .first();

  return row ? mapUserRow(row as Record<string, unknown>) : null;
}

export async function getCmsUserById(locals: App.Locals | undefined, id: string) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  await ensureUserFeatureVisibilityTable(locals);

  const row = await db
    .prepare(
      `SELECT
         users.id,
         users.email,
         users.name,
         users.role,
         users.created_at,
         users.updated_at,
         user_feature_visibility.show_ai_settings,
         user_feature_visibility.show_ai_blog_tools,
         user_feature_visibility.show_linkedin
       FROM users
       LEFT JOIN user_feature_visibility
         ON user_feature_visibility.user_id = users.id
       WHERE users.id = ?
       LIMIT 1`,
    )
    .bind(id)
    .first();

  return row ? mapUserRow(row as Record<string, unknown>) : null;
}

export async function createCmsUser(
  locals: App.Locals | undefined,
  input: {
    email: string;
    id?: string;
    name: string;
    passwordHash: string;
    role: CmsUserRole;
  },
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const id = input.id || crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO users (
        id, email, name, role, password_hash, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(
      id,
      input.email.trim().toLowerCase(),
      input.name.trim(),
      input.role,
      input.passwordHash,
    )
    .run();

  return id;
}

export async function updateCmsUserRole(
  locals: App.Locals | undefined,
  id: string,
  role: CmsUserRole,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await db
    .prepare("UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(role, id)
    .run();

  return getCmsUserById(locals, id);
}

export async function getCmsUserFeatureVisibility(
  locals: App.Locals | undefined,
  user: { id: string; role: CmsUserRole } | null | undefined,
): Promise<CmsUserFeatureVisibility> {
  if (!user || isSuperAdminRole(user.role)) {
    return DEFAULT_CMS_USER_FEATURE_VISIBILITY;
  }

  const db = getDb(locals);

  if (!db) {
    return DEFAULT_CMS_USER_FEATURE_VISIBILITY;
  }

  await ensureUserFeatureVisibilityTable(locals);

  const row = await db
    .prepare(
      `SELECT show_ai_settings, show_ai_blog_tools, show_linkedin
       FROM user_feature_visibility
       WHERE user_id = ?
       LIMIT 1`,
    )
    .bind(user.id)
    .first();

  return mapUserFeatureVisibilityRow(row ? (row as Record<string, unknown>) : {}, user.role);
}

export async function upsertCmsUserFeatureVisibility(
  locals: App.Locals | undefined,
  userId: string,
  visibility: Partial<CmsUserFeatureVisibility>,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureUserFeatureVisibilityTable(locals);

  const normalized = normalizeCmsUserFeatureVisibility(visibility);

  await db
    .prepare(
      `INSERT INTO user_feature_visibility (
        user_id, show_ai_settings, show_ai_blog_tools, show_linkedin, updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        show_ai_settings = excluded.show_ai_settings,
        show_ai_blog_tools = excluded.show_ai_blog_tools,
        show_linkedin = excluded.show_linkedin,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      userId,
      normalized.showAiSettings ? 1 : 0,
      normalized.showAiBlogTools ? 1 : 0,
      normalized.showLinkedIn ? 1 : 0,
    )
    .run();

  return getCmsUserById(locals, userId);
}

export async function deleteCmsUser(locals: App.Locals | undefined, id: string) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureUserFeatureVisibilityTable(locals);
  await db.prepare("DELETE FROM user_feature_visibility WHERE user_id = ?").bind(id).run();
  await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
}

export async function listUserInvitations(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db) {
    return [] as CmsUserInvitationRecord[];
  }

  await ensureUserInvitationsTable(locals);

  const result = await db
    .prepare(
      `SELECT *
       FROM user_invitations
       WHERE accepted_at IS NULL
         AND revoked_at IS NULL
         AND datetime(expires_at) > datetime('now')
       ORDER BY datetime(created_at) DESC, email COLLATE NOCASE ASC`,
    )
    .all();

  return (result.results || []).map((row) => mapUserInvitationRow(row as Record<string, unknown>));
}

export async function getUserInvitationByTokenHash(
  locals: App.Locals | undefined,
  tokenHash: string,
) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  await ensureUserInvitationsTable(locals);

  const row = await db
    .prepare("SELECT * FROM user_invitations WHERE token_hash = ? LIMIT 1")
    .bind(tokenHash)
    .first();

  return row ? mapUserInvitationRow(row as Record<string, unknown>) : null;
}

export async function getActiveInvitationByEmail(
  locals: App.Locals | undefined,
  email: string,
) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  await ensureUserInvitationsTable(locals);

  const row = await db
    .prepare(
      `SELECT *
       FROM user_invitations
       WHERE email = ?
         AND accepted_at IS NULL
         AND revoked_at IS NULL
         AND datetime(expires_at) > datetime('now')
       ORDER BY datetime(created_at) DESC
       LIMIT 1`,
    )
    .bind(email.trim().toLowerCase())
    .first();

  return row ? mapUserInvitationRow(row as Record<string, unknown>) : null;
}

export async function createUserInvitation(
  locals: App.Locals | undefined,
  input: {
    email: string;
    expiresAt: string;
    id?: string;
    invitedByUserId: string;
    featureVisibility?: Partial<CmsUserFeatureVisibility>;
    name: string;
    role: CmsUserRole;
    tokenHash: string;
  },
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureUserInvitationsTable(locals);

  const id = input.id || crypto.randomUUID();
  const featureVisibility = normalizeCmsUserFeatureVisibility(input.featureVisibility);

  await db
    .prepare(
      `INSERT INTO user_invitations (
        id, email, name, role, token_hash, invited_by_user_id,
        show_ai_settings, show_ai_blog_tools, show_linkedin,
        expires_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    )
    .bind(
      id,
      input.email.trim().toLowerCase(),
      input.name.trim(),
      input.role,
      input.tokenHash,
      input.invitedByUserId,
      featureVisibility.showAiSettings ? 1 : 0,
      featureVisibility.showAiBlogTools ? 1 : 0,
      featureVisibility.showLinkedIn ? 1 : 0,
      input.expiresAt,
    )
    .run();

  const invitation = await getUserInvitationByTokenHash(locals, input.tokenHash);

  if (!invitation) {
    throw new Error("Invitation could not be created.");
  }

  return invitation;
}

export async function revokeUserInvitation(locals: App.Locals | undefined, id: string) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureUserInvitationsTable(locals);

  await db
    .prepare(
      `UPDATE user_invitations
       SET revoked_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND accepted_at IS NULL AND revoked_at IS NULL`,
    )
    .bind(id)
    .run();
}

export async function markUserInvitationAccepted(locals: App.Locals | undefined, id: string) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureUserInvitationsTable(locals);

  await db
    .prepare(
      `UPDATE user_invitations
       SET accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND accepted_at IS NULL`,
    )
    .bind(id)
    .run();
}

export async function getSiteSettings(locals?: App.Locals): Promise<SiteSettings> {
  const db = getDb(locals);

  if (!db) {
    return DEFAULT_SITE_SETTINGS;
  }

  await ensureSiteSettingsColumns(locals);

  const row = await db.prepare("SELECT * FROM site_settings WHERE id = 'site' LIMIT 1").first();

  if (!row) {
    return DEFAULT_SITE_SETTINGS;
  }

  return {
    siteName: String(row.site_name || DEFAULT_SITE_SETTINGS.siteName),
    siteUrl: String(row.site_url || DEFAULT_SITE_SETTINGS.siteUrl),
    faviconUrl: String(row.favicon_url || DEFAULT_SITE_SETTINGS.faviconUrl),
    appleTouchIconUrl: String(row.apple_touch_icon_url || DEFAULT_SITE_SETTINGS.appleTouchIconUrl),
    defaultOgImage: String(row.default_og_image || DEFAULT_SITE_SETTINGS.defaultOgImage),
    socialShareTitle: String(row.social_share_title || DEFAULT_SITE_SETTINGS.socialShareTitle),
    socialShareDescription: String(row.social_share_description || DEFAULT_SITE_SETTINGS.socialShareDescription),
    themeColor: String(row.theme_color || DEFAULT_SITE_SETTINGS.themeColor),
    contactEmail: String(row.contact_email || DEFAULT_SITE_SETTINGS.contactEmail),
    contactPhone: String(row.contact_phone || DEFAULT_SITE_SETTINGS.contactPhone),
    navigation: parseJson(row.navigation_json as string, DEFAULT_SITE_SETTINGS.navigation),
    footer: parseJson(row.footer_json as string, DEFAULT_SITE_SETTINGS.footer),
    booking: parseJson(row.booking_json as string, DEFAULT_SITE_SETTINGS.booking),
  };
}

export async function listAllowedInternalLinks(
  locals?: App.Locals,
  options?: { includePosts?: boolean },
) {
  const siteSettings = await getSiteSettings(locals);
  const allowedOrigins = buildAllowedInternalOrigins(siteSettings.siteUrl);
  const links = new Map<string, InternalLinkOption>();
  const includePosts = options?.includePosts !== false;

  addAllowedInternalLink(links, "/", "Home", allowedOrigins);
  addAllowedInternalLink(
    links,
    siteSettings.navigation.ctaButtonLink,
    siteSettings.navigation.ctaButtonText,
    allowedOrigins,
  );
  addAllowedInternalLink(
    links,
    siteSettings.footer.ctaLink,
    siteSettings.footer.ctaText,
    allowedOrigins,
  );

  for (const navLink of siteSettings.navigation.navLinks) {
    addAllowedInternalLink(links, navLink.link, navLink.label, allowedOrigins);
  }

  for (const column of siteSettings.footer.columns) {
    for (const link of column.links) {
      addAllowedInternalLink(links, link.link, link.label, allowedOrigins);
    }
  }

  const db = getDb(locals);

  if (db) {
    const pageRows = await db
      .prepare("SELECT slug, title FROM pages WHERE published = 1 ORDER BY slug ASC")
      .all<{ slug: string; title: string }>();

    for (const row of pageRows.results || []) {
      addAllowedInternalLink(
        links,
        pathForPageSlug(String(row.slug || "")),
        String(row.title || row.slug || ""),
        allowedOrigins,
      );
    }

    if (includePosts) {
      const postRows = await db
        .prepare("SELECT slug, title FROM posts WHERE published = 1 ORDER BY datetime(published_at) DESC, slug ASC")
        .all<{ slug: string; title: string }>();

      for (const row of postRows.results || []) {
        const slug = normalizeSlug(String(row.slug || ""));

        if (!slug) {
          continue;
        }

        addAllowedInternalLink(links, `/blog/${slug}`, String(row.title || slug), allowedOrigins);
      }
    }
  }

  return [...links.values()].sort((a, b) => {
    const aIsBlog = a.href.startsWith("/blog/");
    const bIsBlog = b.href.startsWith("/blog/");

    if (aIsBlog !== bIsBlog) {
      return aIsBlog ? 1 : -1;
    }

    return a.href.localeCompare(b.href);
  });
}

async function buildPostSanitizationContext(
  locals: App.Locals | undefined,
  extraAllowedPaths: string[] = [],
) {
  const siteSettings = await getSiteSettings(locals);
  const allowedOrigins = buildAllowedInternalOrigins(siteSettings.siteUrl);
  const allowedLinks = await listAllowedInternalLinks(locals, { includePosts: true });
  const allowedPaths = makeInternalLinkPathSet(allowedLinks);

  for (const href of extraAllowedPaths) {
    const normalized = normalizeCandidateInternalHref(href, allowedOrigins);

    if (normalized) {
      allowedPaths.add(normalized.path);
    }
  }

  return {
    allowedOrigins,
    allowedPaths,
  };
}

export async function getCmsFeatureFlags(locals?: App.Locals): Promise<CmsFeatureFlags> {
  const db = getDb(locals);

  if (!db) {
    return DEFAULT_CMS_FEATURE_FLAGS;
  }

  await ensureCmsFeatureFlagsTable(locals);

  try {
    const row = await db
      .prepare("SELECT show_ai_dashboard, show_blog FROM cms_feature_flags WHERE id = 'default' LIMIT 1")
      .first();

    if (!row) {
      return DEFAULT_CMS_FEATURE_FLAGS;
    }

    return {
      showAiDashboard: Boolean(row.show_ai_dashboard),
      showBlog: Boolean(row.show_blog),
    };
  } catch (error) {
    console.warn("getCmsFeatureFlags fallback:", error);
    return DEFAULT_CMS_FEATURE_FLAGS;
  }
}

export async function upsertCmsFeatureFlags(
  locals: App.Locals | undefined,
  flags: CmsFeatureFlags,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureCmsFeatureFlagsTable(locals);

  await db
    .prepare(
      `INSERT INTO cms_feature_flags (
        id, show_ai_dashboard, show_blog, updated_at
      ) VALUES ('default', ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        show_ai_dashboard = excluded.show_ai_dashboard,
        show_blog = excluded.show_blog,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(flags.showAiDashboard ? 1 : 0, flags.showBlog ? 1 : 0)
    .run();
}

export async function getAiSettings(locals?: App.Locals): Promise<AiSettings> {
  const db = getDb(locals);

  if (!db) {
    return DEFAULT_AI_SETTINGS;
  }

  try {
    const row = await db.prepare("SELECT * FROM ai_settings WHERE id = 'default' LIMIT 1").first();

    if (!row) {
      return DEFAULT_AI_SETTINGS;
    }

    const storedApiKey = String(row.api_key || DEFAULT_AI_SETTINGS.apiKey);
    const apiKey = await decryptStoredSecret(
      storedApiKey,
      getAiSettingsEncryptionSecret(locals),
    );

    const settings = mergeAiSettingsDefaults({
      provider: String(row.provider || DEFAULT_AI_SETTINGS.provider),
      apiKey,
      defaultBrandPrompt: String(
        row.default_brand_prompt || DEFAULT_AI_SETTINGS.defaultBrandPrompt,
      ),
      imageGeneration: parseJson(
        row.image_generation_json as string,
        DEFAULT_AI_SETTINGS.imageGeneration,
      ),
      blogGeneration: parseJson(
        row.blog_generation_json as string,
        DEFAULT_AI_SETTINGS.blogGeneration,
      ),
      altTextGeneration: parseJson(
        row.alt_text_generation_json as string,
        DEFAULT_AI_SETTINGS.altTextGeneration,
      ),
    });

    let shouldUpgradeSettings = false;

    if (
      settings.blogGeneration.promptTemplate === LEGACY_BLOG_PROMPT_TEMPLATE ||
      settings.blogGeneration.promptTemplate === LEGACY_BLOG_PROMPT_TEMPLATE_WITH_GENERIC_INTERNAL_LINKS
    ) {
      settings.blogGeneration.promptTemplate = DEFAULT_AI_SETTINGS.blogGeneration.promptTemplate;
      shouldUpgradeSettings = true;
    }

    if (
      settings.imageGeneration.model === LEGACY_IMAGE_MODEL &&
      settings.imageGeneration.promptTemplate === LEGACY_IMAGE_PROMPT_TEMPLATE
    ) {
      settings.imageGeneration.model = DEFAULT_AI_SETTINGS.imageGeneration.model;
      settings.imageGeneration.promptTemplate = DEFAULT_AI_SETTINGS.imageGeneration.promptTemplate;
      shouldUpgradeSettings = true;
    }

    if (storedApiKey && !storedApiKey.startsWith("enc:v1:")) {
      shouldUpgradeSettings = true;
    }

    if (shouldUpgradeSettings) {
      await upsertAiSettings(locals, settings);
    }

    return settings;
  } catch (error) {
    console.warn("getAiSettings fallback:", error);
    return DEFAULT_AI_SETTINGS;
  }
}

export async function getLinkedInSettings(locals?: App.Locals): Promise<LinkedInSettings> {
  const db = getDb(locals);

  if (!db) {
    return DEFAULT_LINKEDIN_SETTINGS;
  }

  try {
    const row = await db.prepare("SELECT * FROM linkedin_settings WHERE id = 'default' LIMIT 1").first();

    if (!row) {
      return DEFAULT_LINKEDIN_SETTINGS;
    }

    const storedClientSecret = String(row.client_secret || DEFAULT_LINKEDIN_SETTINGS.clientSecret);
    const storedAccessToken = String(row.access_token || DEFAULT_LINKEDIN_SETTINGS.accessToken);

    const settings = mergeLinkedInSettingsDefaults({
      enabled: Boolean(row.enabled),
      clientId: String(row.client_id || DEFAULT_LINKEDIN_SETTINGS.clientId),
      clientSecret: await decryptStoredSecret(
        storedClientSecret,
        getAiSettingsEncryptionSecret(locals),
      ),
      accessToken: await decryptStoredSecret(
        storedAccessToken,
        getAiSettingsEncryptionSecret(locals),
      ),
      authorUrn: String(row.author_urn || DEFAULT_LINKEDIN_SETTINGS.authorUrn),
      organizationUrn: String(row.organization_urn || DEFAULT_LINKEDIN_SETTINGS.organizationUrn),
      defaultPostCta: String(row.default_post_cta || DEFAULT_LINKEDIN_SETTINGS.defaultPostCta),
    });

    if (
      (storedClientSecret && !storedClientSecret.startsWith("enc:v1:")) ||
      (storedAccessToken && !storedAccessToken.startsWith("enc:v1:"))
    ) {
      await upsertLinkedInSettings(locals, settings);
    }

    return settings;
  } catch (error) {
    console.warn("getLinkedInSettings fallback:", error);
    return DEFAULT_LINKEDIN_SETTINGS;
  }
}

export async function upsertSiteSettings(locals: App.Locals | undefined, settings: SiteSettings) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureSiteSettingsColumns(locals);

  await db
    .prepare(
      `INSERT INTO site_settings (
        id, site_name, site_url, favicon_url, apple_touch_icon_url, default_og_image,
        social_share_title, social_share_description, theme_color, navigation_json,
        footer_json, booking_json, contact_email, contact_phone, updated_at
      ) VALUES ('site', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        site_name = excluded.site_name,
        site_url = excluded.site_url,
        favicon_url = excluded.favicon_url,
        apple_touch_icon_url = excluded.apple_touch_icon_url,
        default_og_image = excluded.default_og_image,
        social_share_title = excluded.social_share_title,
        social_share_description = excluded.social_share_description,
        theme_color = excluded.theme_color,
        navigation_json = excluded.navigation_json,
        footer_json = excluded.footer_json,
        booking_json = excluded.booking_json,
        contact_email = excluded.contact_email,
        contact_phone = excluded.contact_phone,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      settings.siteName,
      settings.siteUrl,
      settings.faviconUrl,
      settings.appleTouchIconUrl,
      settings.defaultOgImage,
      settings.socialShareTitle,
      settings.socialShareDescription,
      settings.themeColor,
      JSON.stringify(settings.navigation),
      JSON.stringify(settings.footer),
      JSON.stringify(settings.booking),
      settings.contactEmail,
      settings.contactPhone,
    )
    .run();
}

export async function upsertAiSettings(locals: App.Locals | undefined, settings: AiSettings) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const encryptedApiKey = await encryptStoredSecret(
    settings.apiKey,
    getAiSettingsEncryptionSecret(locals),
  );

  await db
    .prepare(
      `INSERT INTO ai_settings (
        id, provider, api_key, default_brand_prompt, image_generation_json, blog_generation_json,
        alt_text_generation_json, updated_at
      ) VALUES ('default', ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        provider = excluded.provider,
        api_key = excluded.api_key,
        default_brand_prompt = excluded.default_brand_prompt,
        image_generation_json = excluded.image_generation_json,
        blog_generation_json = excluded.blog_generation_json,
        alt_text_generation_json = excluded.alt_text_generation_json,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      settings.provider,
      encryptedApiKey,
      settings.defaultBrandPrompt,
      JSON.stringify(settings.imageGeneration),
      JSON.stringify(settings.blogGeneration),
      JSON.stringify(settings.altTextGeneration),
    )
    .run();
}

export async function upsertLinkedInSettings(
  locals: App.Locals | undefined,
  settings: LinkedInSettings,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const encryptedClientSecret = await encryptStoredSecret(
    settings.clientSecret,
    getAiSettingsEncryptionSecret(locals),
  );
  const encryptedAccessToken = await encryptStoredSecret(
    settings.accessToken,
    getAiSettingsEncryptionSecret(locals),
  );

  await db
    .prepare(
      `INSERT INTO linkedin_settings (
        id, enabled, client_id, client_secret, access_token, author_urn, organization_urn, default_post_cta, updated_at
      ) VALUES ('default', ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(id) DO UPDATE SET
        enabled = excluded.enabled,
        client_id = excluded.client_id,
        client_secret = excluded.client_secret,
        access_token = excluded.access_token,
        author_urn = excluded.author_urn,
        organization_urn = excluded.organization_urn,
        default_post_cta = excluded.default_post_cta,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      settings.enabled ? 1 : 0,
      settings.clientId,
      encryptedClientSecret,
      encryptedAccessToken,
      settings.authorUrn,
      settings.organizationUrn,
      settings.defaultPostCta,
    )
    .run();
}

export async function getLinkedInConnectionByUserId(
  locals: App.Locals | undefined,
  userId: string,
): Promise<LinkedInConnectionRecord | null> {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  const row = await db
    .prepare(
      "SELECT user_id, linkedin_sub, linkedin_name, linkedin_email, access_token, token_expires_at, scope FROM linkedin_connections WHERE user_id = ? LIMIT 1",
    )
    .bind(userId)
    .first();

  if (!row) {
    return null;
  }

  const storedAccessToken = String(row.access_token || "");
  const accessToken = await decryptStoredSecret(
    storedAccessToken,
    getAiSettingsEncryptionSecret(locals),
  );

  const connection: LinkedInConnectionRecord = {
    userId: String(row.user_id || userId),
    linkedInSub: String(row.linkedin_sub || ""),
    linkedInName: row.linkedin_name ? String(row.linkedin_name) : undefined,
    linkedInEmail: row.linkedin_email ? String(row.linkedin_email) : undefined,
    accessToken,
    expiresAt: row.token_expires_at ? String(row.token_expires_at) : undefined,
    scope: row.scope ? String(row.scope) : undefined,
  };

  if (storedAccessToken && !storedAccessToken.startsWith("enc:v1:")) {
    await upsertLinkedInConnection(locals, connection);
  }

  return connection;
}

export async function upsertLinkedInConnection(
  locals: App.Locals | undefined,
  connection: LinkedInConnectionRecord,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const encryptedAccessToken = await encryptStoredSecret(
    connection.accessToken,
    getAiSettingsEncryptionSecret(locals),
  );

  await db
    .prepare(
      `INSERT INTO linkedin_connections (
        id, user_id, linkedin_sub, linkedin_name, linkedin_email, access_token, token_expires_at, scope, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        linkedin_sub = excluded.linkedin_sub,
        linkedin_name = excluded.linkedin_name,
        linkedin_email = excluded.linkedin_email,
        access_token = excluded.access_token,
        token_expires_at = excluded.token_expires_at,
        scope = excluded.scope,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      connection.userId,
      connection.userId,
      connection.linkedInSub,
      connection.linkedInName || "",
      connection.linkedInEmail || "",
      encryptedAccessToken,
      connection.expiresAt || "",
      connection.scope || "",
    )
    .run();
}

export async function deleteLinkedInConnectionByUserId(
  locals: App.Locals | undefined,
  userId: string,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await db
    .prepare("DELETE FROM linkedin_connections WHERE user_id = ?")
    .bind(userId)
    .run();
}

export async function getPageBySlug(locals: App.Locals | undefined, slug: string) {
  const normalized = normalizeSlug(slug);
  const db = getDb(locals);

  if (db) {
    const row = await db
      .prepare("SELECT * FROM pages WHERE slug = ? AND published = 1 LIMIT 1")
      .bind(normalized)
      .first();

    if (row) {
      return mapPageRow(row);
    }
  }
  return null;
}

export async function listPages(locals?: App.Locals) {
  const db = getDb(locals);

  if (db) {
    const result = await db
      .prepare(
        "SELECT slug, title, description, lang, stylesheets_json, content_html, schema_json, published FROM pages ORDER BY CASE WHEN slug = '' THEN 0 ELSE 1 END, slug ASC",
      )
      .all();

    if (Array.isArray(result.results) && result.results.length > 0) {
      return result.results.map((row) => mapPageRow(row as Record<string, unknown>));
    }
  }
  return [] as CmsPageRecord[];
}

export async function upsertPage(locals: App.Locals | undefined, page: CmsPageRecord) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const existing = await db
    .prepare("SELECT id FROM pages WHERE slug = ? LIMIT 1")
    .bind(normalizeSlug(page.slug))
    .first<{ id: string }>();

  await db
    .prepare(
      `INSERT INTO pages (
        id, slug, title, description, lang, stylesheets_json, content_html, schema_json, published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        lang = excluded.lang,
        stylesheets_json = excluded.stylesheets_json,
        content_html = excluded.content_html,
        schema_json = excluded.schema_json,
        published = excluded.published,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      existing?.id || crypto.randomUUID(),
      normalizeSlug(page.slug),
      page.title,
      page.description,
      page.lang,
      JSON.stringify(page.stylesheets),
      page.contentHtml,
      page.schema ? JSON.stringify(page.schema) : null,
      page.published ? 1 : 0,
    )
    .run();
}

export async function listPosts(
  locals?: App.Locals,
  options?: { includeUnpublished?: boolean },
) {
  const db = getDb(locals);

  if (!db) {
    return [] as CmsPostRecord[];
  }

  const result = await db
    .prepare(
      options?.includeUnpublished
        ? "SELECT * FROM posts ORDER BY published DESC, featured DESC, datetime(published_at) DESC, slug ASC"
        : "SELECT * FROM posts WHERE published = 1 ORDER BY featured DESC, datetime(published_at) DESC, slug ASC",
    )
    .all();

  const posts = (result.results || []).map((row) => mapPostRow(row as Record<string, unknown>));
  const context = await buildPostSanitizationContext(locals);

  return posts.map((post) => sanitizePostRecordContent(post, context));
}

export async function getPostBySlug(
  locals: App.Locals | undefined,
  slug: string,
  options?: { includeUnpublished?: boolean },
) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  const row = await db
    .prepare(
      options?.includeUnpublished
        ? "SELECT * FROM posts WHERE slug = ? LIMIT 1"
        : "SELECT * FROM posts WHERE slug = ? AND published = 1 LIMIT 1",
    )
    .bind(normalizeSlug(slug))
    .first();

  if (!row) {
    return null;
  }

  const post = mapPostRow(row);
  const context = await buildPostSanitizationContext(locals, [`/blog/${normalizeSlug(slug)}`]);

  return sanitizePostRecordContent(post, context);
}

export async function upsertPost(locals: App.Locals | undefined, post: CmsPostRecord) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const sanitizedPost = sanitizePostRecordContent(
    post,
    await buildPostSanitizationContext(locals, [`/blog/${normalizeSlug(post.slug)}`]),
  );

  const existing = await db
    .prepare("SELECT id FROM posts WHERE slug = ? LIMIT 1")
    .bind(normalizeSlug(post.slug))
    .first<{ id: string }>();

  await db
    .prepare(
      `INSERT INTO posts (
        id, slug, title, excerpt, content_html, cover_image_url, cover_image_alt, featured, published,
        published_at, read_time, author_name, author_role, author_slug, primary_category, categories_json, seo_title,
        seo_description, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        excerpt = excluded.excerpt,
        content_html = excluded.content_html,
        cover_image_url = excluded.cover_image_url,
        cover_image_alt = excluded.cover_image_alt,
        featured = excluded.featured,
        published = excluded.published,
        published_at = excluded.published_at,
        read_time = excluded.read_time,
        author_name = excluded.author_name,
        author_role = excluded.author_role,
        author_slug = excluded.author_slug,
        primary_category = excluded.primary_category,
        categories_json = excluded.categories_json,
        seo_title = excluded.seo_title,
        seo_description = excluded.seo_description,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      existing?.id || crypto.randomUUID(),
      normalizeSlug(sanitizedPost.slug),
      sanitizedPost.title,
      sanitizedPost.excerpt,
      sanitizedPost.contentHtml,
      sanitizedPost.coverImageUrl || null,
      sanitizedPost.coverImageAlt || null,
      sanitizedPost.featured ? 1 : 0,
      sanitizedPost.published ? 1 : 0,
      sanitizedPost.publishedAt,
      sanitizedPost.readTime || null,
      sanitizedPost.authorName,
      sanitizedPost.authorRole,
      sanitizedPost.authorSlug || null,
      sanitizedPost.primaryCategory,
      JSON.stringify(sanitizedPost.categories),
      sanitizedPost.seoTitle || null,
      sanitizedPost.seoDescription || null,
    )
    .run();
}

export async function deletePostBySlug(locals: App.Locals | undefined, slug: string) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await db
    .prepare("DELETE FROM posts WHERE slug = ?")
    .bind(normalizeSlug(slug))
    .run();
}

export async function listCatalogProducts(
  locals?: App.Locals,
  options?: { includeUnpublished?: boolean },
) {
  const db = getDb(locals);

  if (!db) {
    return [] as CmsProductRecord[];
  }

  const result = await db
    .prepare(
      options?.includeUnpublished
        ? "SELECT * FROM products ORDER BY published DESC, category_slug ASC, price ASC, slug ASC"
        : "SELECT * FROM products WHERE published = 1 ORDER BY category_slug ASC, price ASC, slug ASC",
    )
    .all();

  const products = (result.results || []).map((row) => mapProductRow(row as Record<string, unknown>));

  return products;
}

export async function getCatalogProductBySlug(
  locals: App.Locals | undefined,
  slug: string,
  options?: { includeUnpublished?: boolean },
) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  const row = await db
    .prepare(
      options?.includeUnpublished
        ? "SELECT * FROM products WHERE slug = ? LIMIT 1"
        : "SELECT * FROM products WHERE slug = ? AND published = 1 LIMIT 1",
    )
    .bind(normalizeSlug(slug))
    .first();

  if (row) {
    return mapProductRow(row);
  }

  return null;
}

export async function upsertCatalogProduct(locals: App.Locals | undefined, product: CmsProductRecord) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await ensureProductImagesColumn(locals);

  const productImages = normalizeProductImages(
    product.heroImageUrl,
    product.heroImageAlt,
    product.productImages,
  );
  const heroImage = productImages[0];

  const existing = await db
    .prepare("SELECT id FROM products WHERE slug = ? LIMIT 1")
    .bind(normalizeSlug(product.slug))
    .first<{ id: string }>();

  await db
    .prepare(
      `INSERT INTO products (
        id, slug, name, price, price_label, hero_image_url, hero_image_alt,
        short_description, is_front_page, meta_title, meta_description,
        category_slug, category_label, overview, best_for_json, spec_notes_json,
        content_html, product_images_json, published, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(slug) DO UPDATE SET
        name = excluded.name,
        price = excluded.price,
        price_label = excluded.price_label,
        hero_image_url = excluded.hero_image_url,
        hero_image_alt = excluded.hero_image_alt,
        short_description = excluded.short_description,
        is_front_page = excluded.is_front_page,
        meta_title = excluded.meta_title,
        meta_description = excluded.meta_description,
        category_slug = excluded.category_slug,
        category_label = excluded.category_label,
        overview = excluded.overview,
        best_for_json = excluded.best_for_json,
        spec_notes_json = excluded.spec_notes_json,
        content_html = excluded.content_html,
        product_images_json = excluded.product_images_json,
        published = excluded.published,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      existing?.id || crypto.randomUUID(),
      normalizeSlug(product.slug),
      product.name,
      product.price ?? null,
      product.priceLabel || null,
      heroImage?.url || product.heroImageUrl,
      heroImage?.alt || product.heroImageAlt || null,
      product.shortDescription,
      product.isFrontPage ? 1 : 0,
      product.metaTitle,
      product.metaDescription,
      product.categorySlug,
      product.categoryLabel,
      product.overview,
      JSON.stringify(product.bestFor),
      JSON.stringify(product.specNotes),
      product.contentHtml,
      JSON.stringify(productImages),
      product.published ? 1 : 0,
    )
    .run();
}

export async function deleteCatalogProductBySlug(locals: App.Locals | undefined, slug: string) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await db
    .prepare("DELETE FROM products WHERE slug = ?")
    .bind(normalizeSlug(slug))
    .run();
}

export async function listMedia(locals?: App.Locals) {
  const db = getDb(locals);

  if (!db) {
    return [] as CmsMediaRecord[];
  }

  const result = await db
    .prepare("SELECT * FROM media ORDER BY datetime(updated_at) DESC, filename ASC")
    .all();

  return (result.results || []).map((row) => mapMediaRow(row as Record<string, unknown>));
}

export async function getMediaByFilename(locals: App.Locals | undefined, filename: string) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  const row = await db
    .prepare("SELECT * FROM media WHERE filename = ? LIMIT 1")
    .bind(filename)
    .first();

  return row ? mapMediaRow(row) : null;
}

export function buildMediaUrl(locals: App.Locals | undefined, filename: string) {
  const publicBase = getMediaPublicBaseUrl(locals);

  if (publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${filename}`;
  }

  return `/api/media/file/${filename}`;
}

export async function saveMediaRecord(
  locals: App.Locals | undefined,
  input: Omit<CmsMediaRecord, "id" | "publicUrl"> & { id?: string },
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const publicUrl = buildMediaUrl(locals, input.filename);
  const id = input.id || crypto.randomUUID();

  await db
    .prepare(
      `INSERT INTO media (
        id, filename, r2_key, public_url, source_url, alt, mime_type, size_bytes, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(r2_key) DO UPDATE SET
        filename = excluded.filename,
        public_url = excluded.public_url,
        source_url = excluded.source_url,
        alt = excluded.alt,
        mime_type = excluded.mime_type,
        size_bytes = excluded.size_bytes,
        updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      id,
      input.filename,
      input.r2Key,
      publicUrl,
      input.sourceUrl || null,
      input.alt || null,
      input.mimeType || null,
      input.sizeBytes || null,
    )
    .run();

  return {
    ...input,
    id,
    publicUrl,
  } satisfies CmsMediaRecord;
}

export async function getMediaById(locals: App.Locals | undefined, id: string) {
  const db = getDb(locals);

  if (!db) {
    return null;
  }

  const row = await db
    .prepare("SELECT * FROM media WHERE id = ? LIMIT 1")
    .bind(id)
    .first();

  return row ? mapMediaRow(row) : null;
}

export async function updateMediaAlt(
  locals: App.Locals | undefined,
  id: string,
  alt: string,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  await db
    .prepare("UPDATE media SET alt = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(alt || null, id)
    .run();
}

export async function deleteMediaRecord(
  locals: App.Locals | undefined,
  id: string,
) {
  const db = getDb(locals);

  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const existing = await getMediaById(locals, id);

  if (!existing) {
    return;
  }

  await db.prepare("DELETE FROM media WHERE id = ?").bind(id).run();

  const bucket = getMediaBucket(locals);
  if (bucket && existing.r2Key) {
    try {
      await bucket.delete(existing.r2Key);
    } catch {
      // R2 deletion failure shouldn't block DB cleanup
    }
  }
}

export interface CmsContentItemRecord {
  createdAt?: string;
  data: Record<string, unknown>;
  id: string;
  published: boolean;
  slug: string;
  type: string;
  updatedAt?: string;
}

function mapContentItemRow(row: Record<string, unknown>): CmsContentItemRecord {
  let data: Record<string, unknown> = {};
  const raw = typeof row.data === "string" ? row.data : "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch {
      data = {};
    }
  }

  return {
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    data,
    id: String(row.id || ""),
    published: row.published === 1 || row.published === true,
    slug: String(row.slug || ""),
    type: String(row.type || ""),
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}

export async function listContentItems(
  locals: App.Locals | undefined,
  type: string,
) {
  const db = getDb(locals);
  if (!db) {
    return [] as CmsContentItemRecord[];
  }
  const result = await db
    .prepare(
      "SELECT * FROM content_items WHERE type = ? ORDER BY datetime(updated_at) DESC, slug ASC",
    )
    .bind(type)
    .all();
  return (result.results || []).map((row) =>
    mapContentItemRow(row as Record<string, unknown>),
  );
}

export async function getContentItem(
  locals: App.Locals | undefined,
  type: string,
  slug: string,
) {
  const db = getDb(locals);
  if (!db) {
    return null;
  }
  const row = await db
    .prepare("SELECT * FROM content_items WHERE type = ? AND slug = ? LIMIT 1")
    .bind(type, slug)
    .first();
  return row ? mapContentItemRow(row) : null;
}

export async function upsertContentItem(
  locals: App.Locals | undefined,
  input: {
    data: Record<string, unknown>;
    id?: string;
    published?: boolean;
    slug: string;
    type: string;
  },
) {
  const db = getDb(locals);
  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const id = input.id || crypto.randomUUID();
  const dataJson = JSON.stringify(input.data || {});
  const published = input.published ? 1 : 0;

  await db
    .prepare(
      `INSERT INTO content_items (id, type, slug, data, published, updated_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(type, slug) DO UPDATE SET
         data = excluded.data,
         published = excluded.published,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(id, input.type, input.slug, dataJson, published)
    .run();

  const stored = await getContentItem(locals, input.type, input.slug);
  return stored ?? {
    data: input.data,
    id,
    published: Boolean(input.published),
    slug: input.slug,
    type: input.type,
  } satisfies CmsContentItemRecord;
}

export async function deleteContentItem(
  locals: App.Locals | undefined,
  type: string,
  slug: string,
) {
  const db = getDb(locals);
  if (!db) {
    throw new Error("D1 binding is not configured.");
  }
  await db
    .prepare("DELETE FROM content_items WHERE type = ? AND slug = ?")
    .bind(type, slug)
    .run();
}

// ── Analytics settings + provider clients ─────────────────────────────

export interface AnalyticsSettings {
  ga4PropertyId: string;
  ga4ServiceAccountJson: string;
  gscSiteUrl: string;
  googleOauthClientId: string;
  googleOauthClientSecret: string;
  googleOauthRefreshToken: string;
  googleOauthEmail: string;
}

const DEFAULT_ANALYTICS_SETTINGS: AnalyticsSettings = {
  ga4PropertyId: "",
  ga4ServiceAccountJson: "",
  gscSiteUrl: "",
  googleOauthClientId: "",
  googleOauthClientSecret: "",
  googleOauthRefreshToken: "",
  googleOauthEmail: "",
};

export async function getAnalyticsSettings(locals?: App.Locals): Promise<AnalyticsSettings> {
  const db = getDb(locals);
  if (!db) {
    return { ...DEFAULT_ANALYTICS_SETTINGS };
  }
  try {
    const row = await db.prepare("SELECT * FROM analytics_settings WHERE id = 1 LIMIT 1").first();
    if (!row) {
      return { ...DEFAULT_ANALYTICS_SETTINGS };
    }
    const secret = getAiSettingsEncryptionSecret(locals);
    const gaJson = row.ga4_service_account_json_encrypted
      ? await decryptStoredSecret(String(row.ga4_service_account_json_encrypted), secret)
      : "";
    const oauthSecret = row.google_oauth_client_secret_encrypted
      ? await decryptStoredSecret(String(row.google_oauth_client_secret_encrypted), secret)
      : "";
    const oauthRefresh = row.google_oauth_refresh_token_encrypted
      ? await decryptStoredSecret(String(row.google_oauth_refresh_token_encrypted), secret)
      : "";
    return {
      ga4PropertyId: String(row.ga4_property_id || ""),
      ga4ServiceAccountJson: gaJson,
      gscSiteUrl: String(row.gsc_site_url || ""),
      googleOauthClientId: String(row.google_oauth_client_id || ""),
      googleOauthClientSecret: oauthSecret,
      googleOauthRefreshToken: oauthRefresh,
      googleOauthEmail: String(row.google_oauth_email || ""),
    };
  } catch (error) {
    console.warn("getAnalyticsSettings fallback:", error);
    return { ...DEFAULT_ANALYTICS_SETTINGS };
  }
}

export async function upsertAnalyticsSettings(
  locals: App.Locals | undefined,
  settings: AnalyticsSettings,
) {
  const db = getDb(locals);
  if (!db) {
    throw new Error("D1 binding is not configured.");
  }
  const secret = getAiSettingsEncryptionSecret(locals);
  const gaEnc = settings.ga4ServiceAccountJson
    ? await encryptStoredSecret(settings.ga4ServiceAccountJson, secret)
    : "";
  const oauthSecretEnc = settings.googleOauthClientSecret
    ? await encryptStoredSecret(settings.googleOauthClientSecret, secret)
    : "";
  const oauthRefreshEnc = settings.googleOauthRefreshToken
    ? await encryptStoredSecret(settings.googleOauthRefreshToken, secret)
    : "";
  await db
    .prepare(
      `INSERT INTO analytics_settings (
         id, ga4_property_id, ga4_service_account_json_encrypted, gsc_site_url,
         google_oauth_client_id, google_oauth_client_secret_encrypted,
         google_oauth_refresh_token_encrypted, google_oauth_email,
         updated_at
       )
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         ga4_property_id = excluded.ga4_property_id,
         ga4_service_account_json_encrypted = excluded.ga4_service_account_json_encrypted,
         gsc_site_url = excluded.gsc_site_url,
         google_oauth_client_id = excluded.google_oauth_client_id,
         google_oauth_client_secret_encrypted = excluded.google_oauth_client_secret_encrypted,
         google_oauth_refresh_token_encrypted = excluded.google_oauth_refresh_token_encrypted,
         google_oauth_email = excluded.google_oauth_email,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(
      settings.ga4PropertyId || null,
      gaEnc || null,
      settings.gscSiteUrl || null,
      settings.googleOauthClientId || null,
      oauthSecretEnc || null,
      oauthRefreshEnc || null,
      settings.googleOauthEmail || null,
    )
    .run();
}


// ── Email settings + form submissions ─────────────────────────────────

export interface EmailSettings {
  fromEmail: string;
  fromName: string;
  notificationEmail: string;
  resendApiKey: string;
}

const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  fromEmail: "",
  fromName: "",
  notificationEmail: "",
  resendApiKey: "",
};

export async function getEmailSettings(locals?: App.Locals): Promise<EmailSettings> {
  const db = getDb(locals);
  if (!db) {
    return { ...DEFAULT_EMAIL_SETTINGS };
  }

  try {
    const row = await db.prepare("SELECT * FROM email_settings WHERE id = 1 LIMIT 1").first();
    if (!row) {
      return { ...DEFAULT_EMAIL_SETTINGS };
    }
    const storedKey = String(row.resend_api_key_encrypted || "");
    const apiKey = storedKey
      ? await decryptStoredSecret(storedKey, getAiSettingsEncryptionSecret(locals))
      : "";
    return {
      fromEmail: String(row.from_email || ""),
      fromName: String(row.from_name || ""),
      notificationEmail: String(row.notification_email || ""),
      resendApiKey: apiKey,
    };
  } catch (error) {
    console.warn("getEmailSettings fallback:", error);
    return { ...DEFAULT_EMAIL_SETTINGS };
  }
}

export async function upsertEmailSettings(
  locals: App.Locals | undefined,
  settings: EmailSettings,
) {
  const db = getDb(locals);
  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const encrypted = settings.resendApiKey
    ? await encryptStoredSecret(settings.resendApiKey, getAiSettingsEncryptionSecret(locals))
    : "";

  await db
    .prepare(
      `INSERT INTO email_settings (id, resend_api_key_encrypted, notification_email, from_email, from_name, updated_at)
       VALUES (1, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO UPDATE SET
         resend_api_key_encrypted = excluded.resend_api_key_encrypted,
         notification_email = excluded.notification_email,
         from_email = excluded.from_email,
         from_name = excluded.from_name,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(encrypted || null, settings.notificationEmail || null, settings.fromEmail || null, settings.fromName || null)
    .run();
}

export interface FormSubmissionRecord {
  archived: boolean;
  createdAt: string;
  email: string;
  formType: string;
  id: string;
  message: string;
  name: string;
  rawData: Record<string, unknown>;
  sourcePath?: string;
  subject: string;
}

function mapFormSubmissionRow(row: Record<string, unknown>): FormSubmissionRecord {
  let rawData: Record<string, unknown> = {};
  const raw = typeof row.raw_data === "string" ? row.raw_data : "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        rawData = parsed as Record<string, unknown>;
      }
    } catch {
      rawData = {};
    }
  }
  return {
    archived: row.archived === 1 || row.archived === true,
    createdAt: String(row.created_at || ""),
    email: String(row.email || ""),
    formType: String(row.form_type || "contact"),
    id: String(row.id || ""),
    message: String(row.message || ""),
    name: String(row.name || ""),
    rawData,
    sourcePath: row.source_path ? String(row.source_path) : undefined,
    subject: String(row.subject || ""),
  };
}

export async function listFormSubmissions(
  locals: App.Locals | undefined,
  options: { includeArchived?: boolean } = {},
) {
  const db = getDb(locals);
  if (!db) {
    return [] as FormSubmissionRecord[];
  }
  const query = options.includeArchived
    ? "SELECT * FROM form_submissions ORDER BY datetime(created_at) DESC"
    : "SELECT * FROM form_submissions WHERE archived = 0 ORDER BY datetime(created_at) DESC";
  const result = await db.prepare(query).all();
  return (result.results || []).map((row) => mapFormSubmissionRow(row as Record<string, unknown>));
}

export async function getFormSubmissionById(
  locals: App.Locals | undefined,
  id: string,
) {
  const db = getDb(locals);
  if (!db) {
    return null;
  }
  const row = await db
    .prepare("SELECT * FROM form_submissions WHERE id = ? LIMIT 1")
    .bind(id)
    .first();
  return row ? mapFormSubmissionRow(row) : null;
}

export async function createFormSubmission(
  locals: App.Locals | undefined,
  input: {
    email?: string;
    formType?: string;
    message?: string;
    name?: string;
    rawData?: Record<string, unknown>;
    sourcePath?: string;
    subject?: string;
  },
) {
  const db = getDb(locals);
  if (!db) {
    throw new Error("D1 binding is not configured.");
  }

  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO form_submissions (id, form_type, name, email, subject, message, raw_data, source_path)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      input.formType || "contact",
      input.name || null,
      input.email || null,
      input.subject || null,
      input.message || null,
      JSON.stringify(input.rawData || {}),
      input.sourcePath || null,
    )
    .run();

  return id;
}

export async function archiveFormSubmission(
  locals: App.Locals | undefined,
  id: string,
  archived: boolean,
) {
  const db = getDb(locals);
  if (!db) {
    throw new Error("D1 binding is not configured.");
  }
  await db
    .prepare("UPDATE form_submissions SET archived = ? WHERE id = ?")
    .bind(archived ? 1 : 0, id)
    .run();
}

export async function deleteFormSubmissionById(
  locals: App.Locals | undefined,
  id: string,
) {
  const db = getDb(locals);
  if (!db) {
    throw new Error("D1 binding is not configured.");
  }
  await db.prepare("DELETE FROM form_submissions WHERE id = ?").bind(id).run();
}

export async function sendResendEmail(input: {
  apiKey: string;
  from: string;
  html?: string;
  replyTo?: string;
  subject: string;
  text?: string;
  to: string;
}) {
  if (!input.apiKey) {
    throw new Error("Resend API key is not configured.");
  }
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: input.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
    }),
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Resend failed (${response.status}): ${detail || response.statusText}`);
  }

  return (await response.json()) as { id?: string };
}

export async function putMediaObject(
  locals: App.Locals | undefined,
  key: string,
  body: ArrayBuffer,
  options: { contentType?: string } = {},
) {
  const bucket = getMediaBucket(locals);

  if (!bucket) {
    throw new Error("R2 binding is not configured.");
  }

  await bucket.put(key, body, {
    httpMetadata: options.contentType ? { contentType: options.contentType } : undefined,
  });
}

export async function getMediaObject(locals: App.Locals | undefined, key: string) {
  const bucket = getMediaBucket(locals);

  if (!bucket) {
    return null;
  }

  return bucket.get(key);
}
