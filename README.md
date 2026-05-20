# Clastro CMS Starter

Clastro is the reusable Astro + Cloudflare CMS starter for custom client sites.

It gives each project a real public website, a custom `/admin` CMS, role-aware user management, media storage, WYSIWYG/live editing, and a Cloudflare deployment path without depending on a third-party CMS SaaS product.

## What This Starter Includes

- Astro rendered on Cloudflare Workers.
- Custom admin interface inside the same project.
- Role-aware CMS users: `super_admin`, `site_owner`, `editor`, and `collaborator`.
- D1 for structured content and settings.
- R2 for uploaded media.
- KV for CMS session storage.
- Tiptap-based rich text editing.
- Live visual editing for seeded CMS pages.
- Generic dummy public site for testing pages, posts, products, media, and editor flows.
- Seed scripts for demo content and a first admin user.

## Core Rule

Develop shared CMS features here first.

Client projects can change branding, page design, copy, integrations, and content models, but the reusable platform pieces should stay aligned with this starter unless a client genuinely needs a fork:

- auth and session handling
- role policy
- admin shell
- media handling
- page/post/product editing primitives
- WYSIWYG/live editor flow
- database migration conventions
- Cloudflare deployment structure

## Common Commands

```bash
npm install
npm run dev
npm run seed:demo
npm run test:roles
npm run build
npm run deploy
```

Create a first admin SQL statement:

```bash
CMS_ADMIN_EMAIL=admin@example.com CMS_ADMIN_PASSWORD='replace-me' npm run --silent admin:sql > admin-user.sql
```

Apply schema and demo seed to a remote D1 database:

```bash
npx wrangler d1 execute clastro-cms-demo-db --remote --file db/schema.sql
npx wrangler d1 execute clastro-cms-demo-db --remote --file db/demo-seed.sql
```

## Starting A Client Project

1. Read `START_A_NEW_PROJECT.md`.
2. Fill out `BRIEF_TEMPLATE.md`.
3. Clone or copy this starter into the new client workspace.
4. Configure fresh Cloudflare D1, KV, and R2 resources.
5. Replace the dummy site design/content with the client implementation.
6. Keep shared CMS changes small and portable.

When a reusable CMS improvement is built in a client project, port it back here before rolling it out elsewhere.

## Repository Map

- `src/pages/admin` - admin routes and API endpoints.
- `src/components/admin` - React admin app, users, media, WYSIWYG, and settings UI.
- `src/layouts` - public site and editable page layouts.
- `src/lib` - auth, repository, role policy, AI, media, and utility code.
- `db/schema.sql` - baseline D1 schema.
- `db/demo-seed.sql` - generated generic demo content.
- `scripts/generate-demo-seed.mjs` - regenerates demo seed SQL.
- `scripts/create-admin-user-sql.mjs` - creates password-hash SQL for the first admin.
- `tests/role-policy.test.mjs` - role and access-policy coverage.

## Upgrade Workflow

Use this folder as the master source for Clastro core. For existing client sites:

1. Compare the client project against this starter.
2. Identify core files, client-specific files, and database changes.
3. Port the core change into a branch in the client project.
4. Apply any D1 migrations explicitly.
5. Verify login, users, dashboard, media, live editor, and public pages.
6. Commit with a clear note of which Clastro starter version or commit was applied.

## Deployment Notes

The starter is designed to run as a real Cloudflare Worker because D1, R2, KV, and Workers runtime behaviour matter. `wrangler.jsonc` should always point at test resources in this starter, never a client production account/resource.
