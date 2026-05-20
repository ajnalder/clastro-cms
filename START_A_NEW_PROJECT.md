# Start A New Project

Use this folder as the baseline whenever a new site should follow the workers-only Clastro CMS pattern.

## What Stays The Same

- Astro on Cloudflare Workers
- custom `/admin` CMS inside the same project
- D1 for structured data
- R2 for media
- the existing API/auth/editor architecture
- the current WYSIWYG and live-editing approach
- the Clastro role policy for super admin, site owner, editor, and collaborator users

Do not redesign the backend pattern unless the brief explicitly asks for it.

## What Changes Per Job

- branding
- CSS
- public content
- page inventory
- SEO targets
- migrations and integrations
- the initial super admin, site owner, editor, and collaborator assignments

## New Build Workflow

1. Create a new client repository from this folder.
2. Fill out `BRIEF_TEMPLATE.md`.
3. Define the public routes and content model required for the client.
4. Replace example content, media, and styling with the new project's implementation.
5. Keep backend structure changes to the minimum required to support the new content model.
6. Configure fresh Cloudflare D1, R2, and KV resources in `wrangler.jsonc` before deployment.
7. Seed the client database with schema, starter content, and the first owner/admin user.

## Existing Site Conversion Workflow

1. Treat the existing site as the content and information-architecture source.
2. Map the old site into this starter's structure.
3. Reuse the current CMS, API, and editor patterns wherever possible.
4. Replace or extend project-specific fields only where the migration requires it.
5. Keep the workers-only deployment model intact.

## Recommended Prompt

Start a new Codex session in this folder and give a prompt like:

> Build a new site from this Clastro CMS starter. Keep the workers-only custom CMS, Astro structure, role model, and WYSIWYG/live-editor pattern intact. Replace the frontend styling and content for this project. If this is a migration, use the existing site as the content source, not as the architecture source.
