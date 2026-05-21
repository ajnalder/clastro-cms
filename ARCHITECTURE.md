# Clastro Architecture

Clastro is a workers-only Astro CMS pattern for small-to-medium custom client
sites. One Cloudflare Worker serves the public site, the React admin, and
the API.

## Stack

- **Framework**: Astro 6 (SSR + Cloudflare adapter)
- **Runtime**: Cloudflare Workers via `@astrojs/cloudflare`
- **Admin UI**: React 19 app mounted inside Astro routes
- **Styling**: Tailwind 4 + shadcn primitives for the admin; hand-rolled
  CSS token system for the public site
- **Database**: Cloudflare D1
- **Media**: Cloudflare R2
- **Sessions**: Cloudflare KV
- **Rich text**: Tiptap 3
- **Email**: Resend (encrypted API key per site)
- **Deployment**: Wrangler

## System shape

### Public site

Ordinary Astro pages under `src/pages/`:

- Shared `SiteLayout` (header, footer, SEO, schema.org JSON-LD)
- Hardcoded structural pages (`about`, `services`, `contact`, `index`,
  `changelog`) that defer to CMS-managed content when available via
  `getPageBySlug`
- Catch-all `[...slug].astro` for editor-created CMS pages
- Catalogue pages (`/products`, `/products/[slug]`, `/blog`,
  `/blog/[slug]`) reading through the same repository functions the admin
  uses
- Public POST endpoint at `/api/forms/<type>` for contact-style
  submissions

### CMS API

All endpoints live under `src/pages/api/[...path].ts` as a single
catch-all handler. Routes are organised by verb (`GET`, `POST`, `PUT`,
`PATCH`, `DELETE`) and switched on path segments.

Core areas:

- `/api/auth/*` — login, logout, session bootstrap
- `/api/users/*`, `/api/users/invitations/*` — user + invite management
- `/api/settings`, `/api/feature-flags` — site config
- `/api/ai-settings`, `/api/linkedin-settings`, `/api/email/settings` —
  encrypted provider keys
- `/api/pages/*`, `/api/posts/*`, `/api/products/*` — hardcoded content
  types
- `/api/content-items/:type[/:slug]` — generic content collections
- `/api/media`, `/api/media/upload`, `/api/media/:id` — R2-backed media
- `/api/email/submissions[/:id]` — form-submission inbox (admin)
- `/api/forms/<type>` — **public** form submission capture
- `/api/linkedin/*` — OAuth callback + share targets
- `/api/ai/*` — title ideas, post drafts, alt-text generation

### Admin UI

Single React app (`src/components/admin/AdminApp.tsx`) mounted at `/admin`.
Tab-based navigation with a sidebar (deep-navy theme + cyan accent) and a
sticky topbar. Surfaces:

**Overview** — Dashboard (stats, quick actions, release notes)

**Content Pages** — Pages (SEO metadata for editor-managed pages), Blog
Posts (full editor with linked Author)

**Content Items** — Products (full editor with linked Category) + one
auto-generated tab per registered content type (Categories, Authors,
Team Members, plus whatever any client adds)

**Manage** — Media library (upload, alt-text edit, delete), Users
(invitations + access)

**Config** — Email (Resend + form submissions inbox), AI Settings (provider
keys + prompt templates), LinkedIn (OAuth + share targets), Site Settings
(identity, contact, social preview defaults)

Newer surfaces (sidebar, topbar, dashboard, list panes, Media, Email tab,
content items, modals, editor headers) are Tailwind + shadcn primitives.
Older surfaces (post/product form bodies, AI Settings, LinkedIn,
bottom-half of Users) still use the `AdminApp.module.css` legacy module —
preferred path for new work is Tailwind.

### Storage

- **D1**: structured content, users, settings, media records, invitations,
  generic content items, form submissions, email settings, AI/LinkedIn
  settings
- **R2**: uploaded images and files
- **KV**: session data

### Encryption

Provider API keys (Resend, AI, LinkedIn client secret + access token) are
encrypted at rest with AES-GCM using the `AI_SETTINGS_ENCRYPTION_SECRET`
env var (shared for all secrets — there is no separate secret per
provider). See `encryptStoredSecret` / `decryptStoredSecret` in
`src/lib/repository.ts`.

## Access model

Roles defined in `src/lib/role-policy.ts`:

- `super_admin` — developer/master access across the CMS
- `site_owner` — client owner access for their site
- `editor` — day-to-day content editing
- `collaborator` — limited support/content access

Client-facing UI must not expose developer-only configuration or
cross-client account/property choices unless the role policy explicitly
allows it. Role checks are enforced server-side (`requireAdmin`,
`requireOwner`, `requireSuperAdmin`, `requireFeatureAccess`) — UI hiding
is a convenience, not security.

## Content model

Two flavours:

1. **Hardcoded content types** (legacy from donor sites): Pages, Posts,
   Products, Media. Each has its own table and bespoke editor.
2. **Generic content items**: one `content_items` table with `(type, slug,
   data JSON)`. Types are declared in `src/lib/content-types.ts`. Each
   declaration auto-generates a sidebar entry, list pane, search,
   editor, and CRUD API. No per-type migrations.

Categories, Authors, and Team Members ship as content items. The Product
editor references a Category, and the Post editor references an Author.

See `AGENTS.md` §5 for the full content-items contract.

## Core vs client code

Put a change in Clastro core when it benefits multiple sites:

- auth, roles, sessions
- users/invitations
- media upload/retrieval
- generic content-items engine
- WYSIWYG / live-editor plumbing
- reusable admin components and shadcn primitives
- D1 migration patterns
- shared SEO/content helpers

Keep it in the client project when it's specific to one site:

- brand styling, public page design
- client copy and media
- one-off imports
- highly specific integrations
- bespoke product attributes that don't generalise

If a content collection is reusable across sites, model it as a content
item in core. If it's truly one-off, declare it in the client project's
own `content-types.ts` and don't port back.

## Migration pattern

Each client project treats Clastro as the upstream starter:

1. Build and test reusable changes here first when practical.
2. Keep database changes in explicit SQL files. Re-apply with
   `wrangler d1 execute --remote --file db/schema.sql` (idempotent).
3. Port core changes into client projects in small batches.
4. Verify login, role visibility, media, page saves, live editing, public
   rendering after each port.
5. Commit with the Clastro version (`CLASTRO_VERSION`) or git SHA that was
   applied.

## Non-negotiables

- The app deploys cleanly to Cloudflare Workers.
- The starter runs with dummy seed content.
- Role boundaries are enforced server-side, not just hidden in the UI.
- Public content remains editable without breaking the admin.
- Client-specific work does not leak into the reusable starter.
- The auto-slug pattern is consistent: typing a name pre-fills the slug
  via `slugify()`; manual edits stop the auto-sync. Don't roll your own.
- Image fields go through the media library; no raw URL-only inputs.
- New repeatable collections use the content-items engine, not new
  hardcoded tables.
