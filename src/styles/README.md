# Style System

Use `site.css` as the single site-wide stylesheet entrypoint.

- `site.css`: Tailwind entrypoint plus explicit source scanning paths.
- `tokens.css`: fonts, colors, spacing primitives, radius, and reusable design tokens.
- `base.css`: element-level defaults and shared spacing helpers.
- `components.css`: reusable custom classes for patterns Tailwind utilities do not express cleanly.

Rule of thumb:

- Use Tailwind utilities first in page/component markup.
- Put repeated visual tokens in `tokens.css`.
- Put repeated cross-page component rules in `components.css`.
- Avoid ad hoc page-specific CSS files unless a page genuinely needs its own isolated styling.
