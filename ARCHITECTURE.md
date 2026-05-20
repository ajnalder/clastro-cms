# Clastro Architecture

Clastro is a workers-only Astro CMS pattern for small-to-medium custom client sites.

## Stack

- Framework: Astro
- Runtime: Cloudflare Workers via `@astrojs/cloudflare`
- Admin UI: custom React app mounted inside Astro routes
- Styling: Tailwind CSS plus project CSS tokens/components
- Database: Cloudflare D1
- Media: Cloudflare R2
- Sessions: Cloudflare KV
- Rich text: Tiptap
- Deployment: Wrangler

## System Shape

### Public Site

The public website is ordinary Astro:

- shared layouts
- editable CMS-backed pages
- repeatable posts and product-style records
- route-level SEO metadata
- JSON-LD helpers where useful
- client-specific design and templates

The starter ships with a dummy public site so the WYSIWYG/editor workflows can be tested in a real page context.

### CMS API

Admin and editor operations live under `/api/*` endpoints in the same Worker.

Core API areas:

- auth and sessions
- users and invitations
- settings and feature flags
- pages
- posts
- products or repeatable records
- media
- AI settings/content helpers

### Admin UI

The admin is custom rather than universal. The shared shell should stay consistent, while each client can add project-specific content tabs where needed.

Baseline admin surfaces:

- dashboard
- pages
- posts/articles
- product-style repeatable records
- media
- users
- AI settings
- site settings
- live editor

### Storage

- D1 stores structured content, users, settings, media records, invitations, and content metadata.
- R2 stores uploaded images and files.
- KV stores session data.

## Access Model

Roles are defined in `src/lib/role-policy.ts`.

- `super_admin`: developer/master access across the CMS.
- `site_owner`: client owner access for their site.
- `editor`: day-to-day content editing.
- `collaborator`: limited support/content access.

Client-facing UI must not expose developer-only configuration or cross-client account/property choices unless the role policy explicitly allows it.

## Core Versus Client Code

Put a change in Clastro core when it benefits multiple sites or protects shared behaviour:

- auth, roles, sessions
- users/invitations
- media upload and retrieval
- WYSIWYG/live editor plumbing
- reusable admin components
- database migration patterns
- shared SEO/content helpers

Keep it in the client project when it is specific to one site:

- brand styling
- public page design
- client copy and media
- one-off imports
- highly specific integrations
- bespoke content types that are unlikely to repeat

## Migration Pattern

Each client project should treat Clastro as the upstream starter:

1. Build and test reusable changes here first when practical.
2. Keep database changes in explicit SQL files.
3. Port core changes into client projects in small batches.
4. Verify login, role visibility, media, page saves, live editing, and public rendering.
5. Commit with the Clastro commit hash or version that was applied.

## Non-Negotiables

- The app deploys cleanly to Cloudflare Workers.
- The starter can run with dummy content.
- Role boundaries are enforced server-side, not just hidden in the UI.
- Public content is editable without breaking the admin.
- Client-specific work does not leak into the reusable starter.
