# Clastro CMS Starter

Reusable Astro + Cloudflare CMS starter for custom client sites. One Worker
runs a public site, a React admin, and a JSON API — backed by D1, R2, and
KV. No third-party CMS SaaS.

> **Working on this codebase with an LLM?** Read [`AGENTS.md`](AGENTS.md)
> first. It is the contract for how to extend Clastro without breaking its
> conventions.

## What's in the box

- **Astro public site** rendered on Cloudflare Workers (`src/pages/*.astro`).
- **Custom `/admin`** React app — dashboard, content editors, media library,
  user management, configuration.
- **Generic content-items system**: drop a definition into
  `src/lib/content-types.ts` and the admin auto-generates a sidebar entry,
  list pane, search, editor form, and CRUD API for it. Starter ships with
  `category`, `author`, `team-member` — add as many as you need without DB
  migrations.
- **Reference fields**: link content items between collections (Products →
  Category, Posts → Author). Pattern is generic — wire any reference to any
  type.
- **Role-aware users**: `super_admin`, `site_owner`, `editor`, `collaborator`,
  with invite-link onboarding.
- **D1** for structured content/settings, **R2** for uploaded media, **KV**
  for sessions.
- **Tiptap** rich text editor + a visual page editor for editor-managed CMS
  pages.
- **Email**: Resend integration. Public sites POST to
  `/api/forms/contact` (or any form name); submissions land in the admin's
  Email tab inbox, optionally forwarding to a notification address.
- **Public catalogue pages** (`/products`, `/products/[slug]`,
  `/blog`, `/blog/[slug]`) that pull through the same data the admin edits.
- **Seed scripts** for demo content and the first super-admin SQL.
- **`AGENTS.md`** — explicit conventions for AI agents extending this
  starter.

## Core rule

Develop shared CMS features here first. Client projects can change branding,
page design, copy, and content models, but these stay aligned with the
starter unless a client genuinely needs a fork:

- auth + session handling
- role policy
- admin shell + primitives
- media upload / retrieval
- the content-items pattern and field types
- page / post / product editing primitives
- WYSIWYG / live editor flow
- D1 migration conventions
- Cloudflare deployment structure

## Common commands

```bash
npm install
npm run dev            # localhost:4321 — fine for public pages
npm run build          # builds to dist/ (server + client)
npm run deploy         # build + wrangler deploy
npm run seed:demo      # regenerate db/demo-seed.sql
npm test               # node:test runner across tests/*.test.mjs
npm run test:roles     # role-policy spec only
npx astro check        # full typecheck — keep at 0 errors
```

Create the first super-admin SQL statement:

```bash
CMS_ADMIN_EMAIL=admin@example.com CMS_ADMIN_PASSWORD='replace-me' \
  npm run --silent admin:sql > admin-user.sql
```

Apply schema and seed to a remote D1 database (every statement is
`CREATE ... IF NOT EXISTS`, so re-running is safe):

```bash
npx wrangler d1 execute clastro-cms-demo-db --remote --file db/schema.sql
npx wrangler d1 execute clastro-cms-demo-db --remote --file db/demo-seed.sql
npx wrangler d1 execute clastro-cms-demo-db --remote --file admin-user.sql
```

## Starting a client project

1. Read [`START_A_NEW_PROJECT.md`](START_A_NEW_PROJECT.md).
2. Fill out [`BRIEF_TEMPLATE.md`](BRIEF_TEMPLATE.md).
3. Clone or copy this starter into the new client workspace.
4. Configure fresh Cloudflare D1, KV, and R2 resources in `wrangler.jsonc`.
5. Replace the dummy public-site design and seed content.
6. Add client-specific content types in `src/lib/content-types.ts` (see
   `AGENTS.md` §5). Keep shared improvements small and portable.

When a reusable CMS improvement is built in a client project, port it back
here before rolling it out elsewhere.

## Adding a content type (the fast version)

```ts
// src/lib/content-types.ts
{
  slug: "testimonial",
  label: "Testimonial",
  labelPlural: "Testimonials",
  description: "Customer quotes for the homepage and product pages",
  icon: "star",
  titleField: "name",
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "slug", label: "Slug", type: "slug", sourceField: "name", required: true },
    { name: "role", label: "Role / company", type: "text" },
    { name: "quote", label: "Quote", type: "textarea", required: true },
    { name: "photoUrl", label: "Photo", type: "image" },
    { name: "photoAlt", label: "Photo alt text", type: "text" },
  ],
},
```

That's the whole change. Restart `npm run dev` and a Testimonials tab
appears under **Content Items**. No migration, no new files.

Need to reference testimonials from a Product editor? Add a `reference`
field with `targetType: "testimonial"`. Need to render them on the public
site? `await listContentItems(Astro.locals, "testimonial")`.

Full details: [`AGENTS.md`](AGENTS.md).

## Repository map

```
src/pages/              Public-site Astro pages
src/pages/admin/        Admin entry + auth pages
src/pages/api/          Catch-all API route (one file)
src/layouts/            SiteLayout + RecoveredPage
src/components/admin/   AdminApp.tsx + LiveEditorApp + RichTextEditor
src/components/ui/      shadcn primitives (Button, Card, Badge, etc.)
src/lib/                repository.ts, auth, role-policy, content-types,
                        ai, seo, version, runtime
src/styles/             Public-site token system (site.css, components.css...)
db/                     schema.sql + generated demo-seed.sql
scripts/                seed generator, admin-user SQL, password hasher,
                        SEO audit
tests/                  node:test specs
AGENTS.md               LLM contributor guide — read first
ARCHITECTURE.md         System shape + access model
START_A_NEW_PROJECT.md  Per-project workflow
BRIEF_TEMPLATE.md       Brief to fill out before kicking off a new build
```

## Upgrade workflow

Use this folder as the master source for Clastro core. For existing client
sites:

1. Compare the client project against this starter.
2. Identify core files, client-specific files, and database changes.
3. Port the core change into a branch in the client project.
4. Apply any D1 migrations explicitly (`wrangler d1 execute --remote --file ...`).
5. Verify login, users, dashboard, media, live editor, public pages.
6. Commit with the Clastro version (`CLASTRO_VERSION` from
   `src/lib/version.ts`) or git SHA that was applied.

## Deployment notes

The starter is designed to run as a real Cloudflare Worker because D1, R2,
KV, and Workers runtime behaviour matter. `wrangler.jsonc` always points at
test resources in this starter — **never** at a client production
account/resource. Client projects get their own `wrangler.jsonc`.
