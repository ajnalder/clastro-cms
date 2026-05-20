# Project Brief Template

Copy this template into a new brief and fill it in before asking Codex to build a new site.

## 1. Project Overview

- Project name:
- Business name:
- Industry:
- Primary domain:
- Launch target:
- Main business goal:
- Secondary goals:

## 2. Website Type

Describe which of these apply:

- Marketing site
- Local business site
- Product catalogue
- Blog/content site
- Lead generation site
- Ecommerce-adjacent site without full checkout
- Full ecommerce site

## 3. Required Content Types

Tick or remove as needed:

- Global site settings
- Static pages
- Flexible marketing pages with editable blocks
- Blog posts
- Categories
- Subcategories
- Brands
- Products
- Product image galleries
- Team/staff
- Testimonials
- FAQs
- Media library
- Users/admin roles

For each custom content type, define:

- Name:
- Purpose:
- Key fields:
- Public URL pattern:
- Needs SEO fields: yes/no
- Needs schema markup: yes/no

## 4. Public Site Structure

List the required public routes:

- `/`
- `/about`
- `/services`
- `/contact`
- `/blog`
- `/blog/[slug]`
- `/products`
- `/products/[slug]`
- `/categories/[slug]`
- `/brands`
- `/brands/[slug]`

Add/remove routes for the actual site.

## 5. CMS / Admin Requirements

Define what editors need to manage:

- Products:
- Posts:
- Pages:
- Categories:
- Brands:
- Media:
- Site settings:
- Users:

Also define:

- Login model:
- User roles:
- Should editors upload media directly:
- Need bulk import tools:
- Need inline page editing:
- Need rich text editor:

## 6. Product / Catalogue Rules

If products are in scope, answer:

- Are products informational only, enquiry-based, or buyable?
- Is pricing shown?
- Are sale prices shown?
- Do products belong to categories, brands, or both?
- Do products need specifications?
- Do products need downloadable PDFs?
- Do products need galleries?
- Is there an external catalogue or partner store:
- Should there be featured products:
- Are there import sources:

## 7. SEO Requirements

Define:

- Primary target locations:
- Primary target search themes:
- Must-have landing pages:
- Meta title rules:
- Meta description rules:
- Open Graph requirements:
- JSON-LD/schema requirements:
- Internal linking priorities:

## 8. Design / UX Direction

Describe:

- Brand personality:
- Preferred visual tone:
- Existing brand assets available:
- Sites to reference:
- Sites to avoid resembling:
- Mobile importance:
- Accessibility requirements:

Also note:

- Header/nav style:
- Footer requirements:
- CTA style:
- Photography vs graphics:

## 9. Integrations

List all needed integrations:

- Forms/email:
- Maps:
- Social:
- Search:
- Analytics:
- CRM:
- Booking:
- External APIs:

## 10. Cloudflare / Platform Requirements

- Use Cloudflare Workers: yes/no
- Use D1: yes/no
- Use R2: yes/no
- Use custom domain:
- Need staging environment:
- Need preview deploys:

## 11. Content Migration

- Existing site URL:
- Existing CMS:
- Blog migration needed: yes/no
- Product migration needed: yes/no
- Media migration needed: yes/no
- Structured exports available:

## 12. Deliverables Required From Codex

Select what you want:

- Working Astro frontend
- Cloudflare-ready Worker deployment
- Custom CMS admin
- D1 schema
- Media upload flow
- Import scripts
- SEO/schema implementation
- Content migration helpers
- Deployment guide

## 13. Build Instructions For Codex

Use this wording when handing the brief back:

> Build this as an Astro site on Cloudflare using the custom CMS starter pattern. Use D1 for structured content, R2 for media, a custom `/admin` interface, and an API layer that supports the listed content types. Keep the implementation modular so this can become a repeatable starter pattern for future projects.
