# AGENTS.md

Read this first if you're an LLM (Claude, Codex, Cursor, etc.) working on this
codebase. It is the contract for how to extend the Clastro CMS starter without
breaking its conventions or forcing the next agent to clean up after you.

If anything below contradicts what you see in the code, the **code wins** — but
please also update this file so the next agent isn't tripped up.

---

## 1. What this is

A reusable CMS starter for small-to-medium client sites. One Cloudflare Worker
runs:

- An **Astro** public site (`src/pages/*.astro`, layouts in `src/layouts/`).
- A **React admin app** (`src/components/admin/AdminApp.tsx`) mounted at
  `/admin`.
- All API endpoints under `/api/*` (single catch-all
  `src/pages/api/[...path].ts`).

Backed by Cloudflare **D1** (structured data), **R2** (media), **KV**
(sessions). Rich text via **Tiptap**. Styling: Tailwind for the admin, a
hand-rolled CSS token system (`src/styles/`) for the public site.

This starter is the **donor codebase** — each client project copies it, then
diverges. Treat anything you add here as something every future site inherits.

---

## 2. Workflow

Local dev works for the **public site** (no auth needed). The **admin** needs
a real user in D1, which the local dev DB usually doesn't have — so most admin
verification happens via Cloudflare deploys, not local preview.

```bash
npm install
npm run dev            # localhost:4321 — fine for public pages
npm run build          # builds to dist/
npm run deploy         # build + wrangler deploy (use this to verify admin work)
npm test               # node:test runner across tests/*.test.mjs
npx astro check        # full typecheck — keep this at 0 errors
```

DB migrations are **idempotent** — every statement in `db/schema.sql` is
`CREATE TABLE IF NOT EXISTS` / `CREATE INDEX IF NOT EXISTS`. Apply with:

```bash
npx wrangler d1 execute clastro-cms-demo-db --remote --file db/schema.sql
```

For column adds, use `ALTER TABLE ... ADD COLUMN ...` directly. For column
drops, `ALTER TABLE ... DROP COLUMN ...` works on modern SQLite (D1 supports
it).

---

## 3. Repository map

```
src/
  pages/
    *.astro                       Public-site pages (index, about, blog,
                                  products, services, contact, changelog)
    [...slug].astro               Catch-all for editor-managed CMS pages
    admin/                        Admin entry + auth pages
    api/[...path].ts              All API routes (GET/POST/PUT/PATCH/DELETE)
    products/[slug].astro         Public product detail
    blog/[slug].astro             Public post detail
  layouts/
    SiteLayout.astro              Public site shell (header, footer, SEO)
    Layout.astro                  Thin wrapper around SiteLayout
    RecoveredPage.astro           Renders editor-managed page HTML
  components/
    admin/
      AdminApp.tsx                The whole admin app (~6000 lines)
      AdminApp.module.css         Module styles (legacy — Tailwind preferred
                                  for new work)
      LiveEditorApp.tsx           Visual page editor
      RichTextEditor.tsx          Tiptap wrapper
    ui/                           shadcn primitives (Button, Card, Badge, etc.)
    SiteHeader / SiteFooter ...   Public-site components
    recovered/                    Editor-managed page renderer
  lib/
    repository.ts                 ALL D1 access — every read/write goes here
    auth.ts                       Session + login
    runtime.ts                    Cloudflare binding helpers (getDb, getMediaBucket)
    role-policy.ts                Role + permission checks
    content-types.ts              Content-item type registry (see §5)
    ai.ts                         AI helpers (OpenAI client, prompts)
    seo.ts                        Schema + meta helpers
    version.ts                    CLASTRO_VERSION + CLASTRO_CHANGELOG (single source of truth)
    utils.ts                      cn() helper
  styles/
    global.css                    Token vars + dark mode
    site.css, components.css,
    tokens.css, base.css          Public-site CSS system
db/
  schema.sql                      Authoritative D1 schema
  demo-seed.sql                   Generated demo content (don't hand-edit)
scripts/
  generate-demo-seed.mjs          Regenerates demo-seed.sql
  create-admin-user-sql.mjs       Emits SQL to create the first super-admin
  hash-password.mjs               Standalone password hasher
  seo-audit.mjs                   Live-site SEO check
tests/
  *.test.mjs                      node:test runner specs
```

---

## 4. The admin

`AdminApp.tsx` is one big component. It's organised by tab:

- `dashboard` — landing screen with stats + quick actions + "What's New"
  (release notes from `CLASTRO_CHANGELOG`)
- `pages` — list + SEO-only editor for editor-managed CMS pages
- `posts` — full blog post editor
- `products` — full product editor (name, slug, media, category, etc.)
- `media` — library with upload, alt-text edit, delete
- `users` — invitations + access management
- `email` — Resend API key + inbox of `form_submissions`
- `ai`, `linkedin`, `settings` — configuration
- `content-item:<typeSlug>` — **dynamic tab per registered content type**
  (see §5)

Sidebar groups: **Overview**, **Content Pages** (Pages, Blog Posts),
**Content Items** (Products + every registered content type), **Manage**
(Media, Users), **Config** (Email, AI, LinkedIn, Site Settings).

Newer surfaces (sidebar, topbar, dashboard, all list panes, Media, Email tab,
content items, all modals) are Tailwind + shadcn primitives. Older surfaces
(post/product editor form bodies, AI settings, LinkedIn settings, Users tab
bottom half) still use `AdminApp.module.css`. Prefer Tailwind + the shadcn
primitives in `src/components/ui/` for new work.

---

## 5. Content items — the most important pattern

**Content items** are the way to add new repeatable content collections
(authors, locations, team members, FAQs, testimonials, cuisines, anything).
Adding one is a single change: append an entry to
`CONTENT_TYPE_DEFINITIONS` in `src/lib/content-types.ts`. The admin sidebar
entry, list pane, search, editor form, CRUD API, and DB row all come for free.

### Field types

```ts
export type ContentFieldType =
  | "text"        // single-line input
  | "textarea"    // multi-line
  | "rich-text"   // Tiptap editor
  | "slug"        // URL-safe, auto-derived from another field (see §6)
  | "image"       // uploads via media library, stores URL
  | "url"         // type=url input
  | "boolean"     // checkbox
  | "reference";  // dropdown of items from another content type
```

### Add a new content type

```ts
// src/lib/content-types.ts
{
  slug: "location",                       // DB type discriminator + URL segment
  label: "Location",
  labelPlural: "Locations",
  description: "Physical sites and addresses",
  icon: "pin",                            // tag | people | pin | document | star | briefcase
  titleField: "name",                     // which field shows in lists
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", sourceField: "name", required: true },
    { name: "address", label: "Address", type: "textarea" },
    { name: "heroImageUrl", label: "Hero image", type: "image" },
    { name: "heroImageAlt", label: "Hero image alt text", type: "text" },
    { name: "description", label: "Description", type: "textarea" },
    { name: "manager", label: "Manager", type: "reference", targetType: "team-member" },
  ],
},
```

That's it. No migration. No new files. Restart `npm run dev` and the
Locations tab appears under **Content Items** in the sidebar.

### Reference any content type from any other

A `reference` field stores the slug of a target-type item. Reference back from
hardcoded editors (Posts → Author, Products → Category) by using the
`ContentItemReferenceSelect` React component inside `AdminApp.tsx`:

```tsx
<ContentItemReferenceSelect
  helperText="Picks from your Categories collection."
  label="Category"
  onChange={(slug, item) => {
    const label = item?.data?.name ?? slug;
    setProductDraft({ ...productDraft, categorySlug: slug, categoryLabel: label });
  }}
  targetType="category"
  value={productDraft.categorySlug}
/>
```

Patterns established:
- **Products → `category`** (Category content item)
- **Posts → `author`** (Author content item, populates `authorName` + `authorRole`)

When wiring a new reference, denormalise the picked item's title onto the
parent record (`categoryLabel`, `authorName`) so public-site templates can
render without an extra lookup. The slug is the source of truth.

### Storage model

Single `content_items` table:

```sql
CREATE TABLE content_items (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,          -- matches ContentTypeDefinition.slug
  slug TEXT NOT NULL,          -- per-type unique
  data TEXT NOT NULL,          -- JSON: { name, slug, ...all fields }
  published INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(type, slug)
);
```

All field values live in the JSON `data` column. **Don't** create per-type
columns or per-type tables.

### API

- `GET    /api/content-items/:type` — list
- `GET    /api/content-items/:type/:slug` — single
- `PUT    /api/content-items/:type/:slug` — upsert
- `DELETE /api/content-items/:type/:slug` — delete

Repository methods: `listContentItems`, `getContentItem`,
`upsertContentItem`, `deleteContentItem` in `src/lib/repository.ts`.

### Rendering content items on the public site

```astro
---
import { listContentItems, getContentItem } from "../lib/repository";

const teamMembers = await listContentItems(Astro.locals, "team-member");
const category = await getContentItem(Astro.locals, "category", "high-wall");
---
```

`listContentItems` returns published + drafts — filter in the page if you only
want published.

---

## 6. Slug convention (do not break this)

Every form with a Name/Title field auto-fills the slug as the user types,
and **stops auto-syncing** the moment the user manually edits the slug.

Implementation pattern (used in Products, Posts, generic content items):

```ts
const autoSlugMatch = !current.slug || current.slug === slugify(current.name);
const nextSlug = autoSlugMatch ? slugify(nextName) : current.slug;
```

`slugify()` is exported from `src/lib/content-types.ts`:

```ts
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
```

If you add a new editor that has a name/title and slug, use this pattern. Do
NOT roll your own.

---

## 7. Other established conventions

- **Images** always come from the media library. Every image field shows an
  **Upload image** button that posts to `/api/media/upload` and stores the
  returned `publicUrl`. URL-paste is supported as a fallback. Don't introduce
  image fields that only accept a URL.
- **Confirmation dialogs** are in-app modals, not `window.confirm()`. See
  `mediaDeleteConfirm` / `contentItemDeleteConfirm` for the pattern.
- **Action bars at the top of editor panes**: Published toggle + Delete +
  Save. Bottom action rows are OK as a convenience but the top bar is the
  primary surface.
- **Dark + light themes** flip via the `dark` class on the admin root. shadcn
  tokens (`bg-card`, `text-foreground`, `border-border`, etc.) handle most
  things — only reach for hex codes when you genuinely need to.
- **Status banners** use `setStatus({ kind: 'info' | 'error', text })`.
  Don't pop alerts or write to the document.
- **Encrypted secrets** (Resend API key, AI API key, LinkedIn client secret)
  use `encryptStoredSecret` / `decryptStoredSecret` in `repository.ts`.
  Reuse `getAiSettingsEncryptionSecret` — don't introduce another secret.
- **Public form submissions** post to `/api/forms/<type>` (e.g.
  `/api/forms/contact`). Anything captured shows up in the admin's Email tab
  inbox. The form name in the URL becomes the `form_type` column.

---

## 8. What NOT to do

- **Don't add HVAC/service/industry-specific fields** to the core schema. The
  donor site had `heating_kw`, `aircon_type`, `family_code`, `brochure_href`,
  etc. — all stripped. If a client needs custom product attributes, model
  them as a content item or fork the Product editor in their project.
- **Don't create per-type DB tables** for new content collections. Use the
  `content_items` table.
- **Don't hardcode category enums.** Categories are content items
  (`type: 'category'`) — products reference them by slug.
- **Don't use Bootstrap/Tailwind container classes** like
  `<div class="container">` or `<section class="section">` on the public
  site — those classes don't exist. The actual primitives are `page-shell`,
  `content-band`, `section-stack`, `section-heading`, `card-list`,
  `feature-grid`.
- **Don't add `--background`, `--foreground`, `--card`, etc. to admin
  CSS-module overrides.** Those tokens are owned by `src/styles/global.css`
  and flip with the `dark` class. Override `--admin-panel-soft` /
  `--admin-text-muted` for legacy CSS module styling only.
- **Don't run `wrangler deploy` against a client production worker** from
  this repo. `wrangler.jsonc` points at the demo worker
  (`clastro-cms-demo`). Each client project gets its own wrangler config.
- **Don't downgrade the auto-slug logic.** If a name → slug pattern exists
  anywhere, it must use the `slugify(currentSlug === slugify(oldName))`
  approach so it stops syncing on manual edit.

---

## 9. Public-site CSS quick-reference

The public site uses a token system (not Tailwind). Primitives:

- `page-shell` — outer wrapper, max-width + side padding
- `content-band` — surfaced text card (bg, border, radius, shadow)
- `section-heading` — left-aligned section title block
- `section-stack` — vertical gap between top-level sections
- `section-pad` — top/bottom page padding
- `card-list` — auto-fit card grid (children get bg/border/radius)
- `feature-grid` — fixed 3-column grid
- `eyebrow` — small uppercase label above headings
- `text-link` — accent-coloured inline link

CSS tokens live in `src/styles/tokens.css`. Don't introduce new ones casually.

---

## 10. Build/typecheck contract

Before committing:

```bash
npx astro check                # 0 errors required
npm test                       # all tests pass
npm run build                  # builds to dist/server (Cloudflare worker)
```

Hints from `astro check` are tolerated (mostly unused-variable warnings in
the legacy admin code). Errors are not.

---

## 11. When you're done

Update:

- `src/lib/version.ts` — bump `CLASTRO_VERSION` and prepend a
  `CLASTRO_CHANGELOG` entry. The dashboard "What's New" card and the
  `/changelog` page both read from this constant.
- This file (`AGENTS.md`) — if you introduced a new convention or pattern
  that the next agent needs to know.

Then deploy with `npm run deploy` and verify in the live admin.
