# Clastro Master Starter Plan

## Objective

Create a reusable Clastro CMS starter from the latest role-aware implementation, with a generic dummy site, clean Git history, and a real Cloudflare test deployment.

## Implementation

1. Strip client-specific content, routes, fallback data, media, scripts, prompts, and hard-coded domains.
2. Keep the shared CMS core: auth, users, roles, media, pages, posts, products, AI settings, and live editor.
3. Seed D1 with generic demo pages, posts, products, settings, and feature flags.
4. Add an admin-user SQL generator for first-time setup without committing credentials.
5. Document how to start new client projects and how to port Clastro upgrades into existing sites.
6. Provision dedicated Cloudflare test resources for the starter.
7. Verify role tests, build, remote deployment, and admin/public routes.
8. Initialize a dedicated Git repository for the starter and make the first clean commit.

## Verification

- `npm run test:roles`
- `npm run build`
- `npm run deploy:dry-run`
- remote D1 schema/seed apply
- Cloudflare deploy
- public demo route check
- admin login route check
