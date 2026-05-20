# Recommended Source Structure

Use this as the default project layout:

```text
src/
  components/
    Header.astro
    Footer.astro
    SeoSchema.astro
  layouts/
    Layout.astro
  lib/
    cms.ts
    seo.ts
    auth.ts
    media.ts
    content-model.ts
  pages/
    index.astro
    about.astro
    contact.astro
    admin.astro
    api/
      [...path].ts
    blog/
      index.astro
      [slug].astro
    brands/
      index.astro
      [slug].astro
    products/
      index.astro
      [slug].astro
      category/
        [slug].astro
  styles/
    global.css
```

## Notes

- `src/lib/cms.ts`
  Shared frontend fetch helpers and content typings.
- `src/pages/api/[...path].ts`
  Worker-side API handler for auth, CRUD, uploads, and settings.
- `src/pages/admin.astro`
  Custom admin UI for the project's actual content model.
- `src/pages/*`
  Public site routes fed by the CMS API.

Keep the folder structure stable across projects even when the content model changes. That makes the whole system easier to clone and reason about.
