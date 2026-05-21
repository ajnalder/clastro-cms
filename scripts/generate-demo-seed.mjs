import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const outputPath = fileURLToPath(new URL("../db/demo-seed.sql", import.meta.url));
const siteUrl = (process.env.CLASTRO_DEMO_SITE_URL || "https://clastro-cms-demo.ajnalder.workers.dev").replace(/\/$/, "");

function sql(value) {
  if (value === null || value === undefined) {
    return "NULL";
  }

  return `'${String(value).replace(/'/g, "''")}'`;
}

function json(value) {
  return sql(JSON.stringify(value));
}

const navigation = {
  navLinks: [
    { label: "Home", link: "/" },
    { label: "About", link: "/about" },
    { label: "Services", link: "/services" },
    { label: "Products", link: "/products" },
    { label: "Blog", link: "/blog" },
    { label: "Contact", link: "/contact" },
  ],
  phoneText: "+64 21 000 0000",
  phoneLink: "tel:+64210000000",
  ctaButtonText: "Open CMS",
  ctaButtonLink: "/admin",
};

const footer = {
  tagline: "A generic Clastro demonstration site for testing pages, repeatable content, media, roles, and the WYSIWYG editor.",
  phoneText: "+64 21 000 0000",
  emailText: "hello@clastro.local",
  columns: [
    {
      heading: "Demo Site",
      links: [
        { label: "Home", link: "/" },
        { label: "About", link: "/about" },
        { label: "Services", link: "/services" },
        { label: "Products", link: "/products" },
      ],
    },
    {
      heading: "CMS",
      links: [
        { label: "Admin", link: "/admin" },
        { label: "Live Editor", link: "/admin/edit" },
        { label: "Blog", link: "/blog" },
        { label: "Changelog", link: "/changelog" },
      ],
    },
    {
      heading: "Contact",
      links: [
        { label: "Email", link: "mailto:hello@clastro.local" },
        { label: "Contact Page", link: "/contact" },
      ],
    },
  ],
  ctaText: "Open Admin",
  ctaLink: "/admin",
};

const booking = {
  consultation: {
    title: "Demo Enquiry",
    duration: "15 minutes",
    price: "Free",
    description: "A placeholder enquiry flow for testing buttons, modals, and CMS-managed links.",
    href: "/contact",
  },
  session: {
    title: "Implementation Session",
    duration: "60 minutes",
    price: "Demo",
    description: "A second placeholder action for checking multi-card booking content.",
    href: "/contact",
  },
  note: "This is dummy booking content. Replace it per client.",
};

const aiSettings = {
  imageGeneration: {
    enabled: true,
    model: "gpt-image-1.5",
    size: "1536x1024",
    quality: "high",
    background: "auto",
    promptTemplate:
      'Create a realistic editorial image for "{{title}}". Article summary: {{excerpt}}. Visual direction: clean modern business website, content management, digital publishing, natural light, no text, no logos, no watermarks.',
  },
  blogGeneration: {
    enabled: true,
    model: "gpt-4.1",
    titleIdeasPromptTemplate:
      'Suggest {{count}} blog post titles for "{{siteName}}" about "{{topic}}". Primary audience: {{audience}}. Goal: {{goal}}. Keep them clear, practical, and useful for a website CMS demo.',
    promptTemplate:
      'Write a blog post for "{{siteName}}" about "{{topic}}". Primary audience: {{audience}}. Goal: {{goal}}. Use a practical, expert, approachable tone. Structure the article with a strong H1, clear H2/H3 sections, a concise excerpt, a clear final CTA, and five FAQ-style answers suitable for AEO and FAQ schema.',
    seoPromptTemplate: "Based on the article draft, generate an SEO title and meta description that are clear, human, and search-friendly.",
  },
  altTextGeneration: {
    enabled: true,
    model: "gpt-4.1-mini",
    maxLength: 160,
    promptTemplate: "Write concise, accurate alt text for this image in a generic business website CMS demo.",
  },
};

const pages = [
  {
    slug: "",
    title: "Clastro Demo | CMS Starter",
    description: "A generic Clastro CMS starter site for testing content, media, roles, products, posts, and live editing.",
    content: `
<section class="hero-shell">
  <div class="hero-copy">
    <p class="eyebrow">Editable Demo Page</p>
    <h1>Test Clastro CMS on a real deployed site.</h1>
    <p>This home page is seeded into D1 so the live editor can update copy, headings, links, and layout content without touching code.</p>
    <div class="hero-actions">
      <a class="button button-primary" href="/admin">Open Admin</a>
      <a class="button button-secondary" href="/admin/edit">Launch Live Editor</a>
    </div>
  </div>
  <div class="hero-visual" aria-label="CMS dashboard preview">
    <div class="hero-visual-bar"></div>
    <div class="hero-visual-grid"><span></span><span></span><span></span><span></span></div>
    <div class="hero-visual-list"><span></span><span></span><span></span></div>
  </div>
</section>
<section class="section-panel">
  <div class="section-heading">
    <p class="eyebrow">CMS Core</p>
    <h2>Shared functionality belongs here first.</h2>
  </div>
  <div class="feature-grid">
    <article><h3>Roles</h3><p>Super admin, site owner, editor, and collaborator access can be tested safely.</p></article>
    <article><h3>WYSIWYG</h3><p>Use the live editor to change this seeded content and save it back to D1.</p></article>
    <article><h3>Deployability</h3><p>This generic site is deployed to Cloudflare so Worker, D1, KV, and R2 behaviour is real.</p></article>
  </div>
</section>`,
  },
  {
    slug: "about",
    title: "About Clastro Demo",
    description: "About the generic Clastro CMS starter and its core boundaries.",
    content: `
<main class="page-shell">
  <section class="content-band">
    <p class="eyebrow">About</p>
    <h1>Clastro is the reusable CMS core.</h1>
    <p>Client websites should be free to look and behave differently, but authentication, roles, media, editing, and shared CMS workflows need one reliable home.</p>
  </section>
  <section class="feature-grid">
    <article><h2>Core first</h2><p>New CMS features are developed and tested in this starter before being ported into client installs.</p></article>
    <article><h2>Client second</h2><p>Public templates, brand systems, content models, and integrations can be adapted per client.</p></article>
    <article><h2>Documented upgrades</h2><p>Every upgrade should note changed files, migrations, settings, secrets, and verification steps.</p></article>
  </section>
</main>`,
  },
  {
    slug: "services",
    title: "Services | Clastro Demo",
    description: "Generic service content used to test editable marketing pages.",
    content: `
<main class="page-shell">
  <section class="content-band">
    <p class="eyebrow">Services</p>
    <h1>Dummy services for rich page editing.</h1>
    <p>This page deliberately uses normal marketing-page sections so the live editor has realistic text, links, and repeated cards to work with.</p>
  </section>
  <section class="feature-grid">
    <article><h2>Content setup</h2><p>Map page structure, defaults, and repeatable records for a new CMS project.</p></article>
    <article><h2>CMS implementation</h2><p>Adapt Clastro's shared admin and content model to the client site.</p></article>
    <article><h2>Upgrade support</h2><p>Port tested core improvements into existing client installs with a clear checklist.</p></article>
  </section>
</main>`,
  },
  {
    slug: "contact",
    title: "Contact | Clastro Demo",
    description: "A dummy contact page for the Clastro CMS starter.",
    content: `
<main class="page-shell">
  <section class="content-band">
    <p class="eyebrow">Contact</p>
    <h1>Dummy contact content.</h1>
    <p>Use this page to test editable forms, CTA language, and footer/navigation links. The form is intentionally non-sending in the starter.</p>
    <form class="demo-form">
      <label><span>Name</span><input name="name" placeholder="Jane Example" /></label>
      <label><span>Email</span><input name="email" type="email" placeholder="jane@example.com" /></label>
      <label><span>Message</span><textarea name="message" placeholder="This is a demo form."></textarea></label>
      <button class="button button-primary" type="button">Demo Submit</button>
    </form>
  </section>
</main>`,
  },
];

const posts = [
  {
    slug: "what-belongs-in-the-core-cms",
    title: "What Belongs in the Core CMS?",
    excerpt: "A simple way to decide whether a feature belongs in Clastro core or in a client implementation.",
    content:
      "<p>A CMS feature belongs in core when multiple client sites need it, when it protects access or data, or when it improves the editing workflow everywhere.</p><h2>Keep the core small but serious</h2><p>Authentication, roles, media, pages, posts, and deployment conventions should be reliable shared infrastructure.</p><h2>Frequently Asked Questions</h2><h3>Should every client have identical content types?</h3><p>No. Shared primitives should be reusable, while client-specific content types can be added at the project layer.</p>",
    category: "CMS",
  },
  {
    slug: "testing-the-live-editor",
    title: "Testing the Live Editor",
    excerpt: "A checklist for checking WYSIWYG editing against realistic seeded pages.",
    content:
      "<p>The live editor should be tested on headings, paragraphs, cards, links, images, and navigation between pages.</p><h2>What to verify</h2><ul><li>Text can be edited and saved.</li><li>Links remain valid.</li><li>Images can be replaced from the media library.</li><li>Refreshing the page keeps the saved content.</li></ul>",
    category: "Editing",
  },
];

const products = [
  {
    slug: "starter-implementation",
    name: "Starter Implementation",
    category: "CMS Packages",
    shortDescription: "A generic product-style record for testing repeatable CMS content.",
    overview: "Use this record to test product detail pages, product galleries, pricing labels, and rich product copy.",
    priceLabel: "Demo",
  },
  {
    slug: "client-upgrade-kit",
    name: "Client Upgrade Kit",
    category: "CMS Packages",
    shortDescription: "A second dummy record for checking lists, filters, and detail-page rendering.",
    overview: "This entry represents a packaged CMS upgrade path for existing client sites.",
    priceLabel: "Internal",
  },
];

const statements = [
  "PRAGMA foreign_keys = ON;",
  "DELETE FROM site_settings WHERE id = 'site';",
  "DELETE FROM ai_settings WHERE id = 'default';",
  "DELETE FROM cms_feature_flags WHERE id = 'default';",
  `INSERT INTO site_settings (id, site_name, site_url, favicon_url, apple_touch_icon_url, default_og_image, social_share_title, social_share_description, theme_color, navigation_json, footer_json, booking_json, contact_email, contact_phone, updated_at)
VALUES ('site', 'Clastro Demo', ${sql(siteUrl)}, ${sql(`${siteUrl}/favicon.svg`)}, ${sql(`${siteUrl}/images/clastro-logo.svg`)}, ${sql(`${siteUrl}/images/clastro-logo.svg`)}, 'Clastro Demo | CMS Starter', 'A generic Clastro CMS starter site for testing content, media, roles, products, posts, and live editing.', '#020024', ${json(navigation)}, ${json(footer)}, ${json(booking)}, 'hello@clastro.local', '+64 21 000 0000', CURRENT_TIMESTAMP);`,
  `INSERT INTO ai_settings (id, provider, api_key, default_brand_prompt, image_generation_json, blog_generation_json, alt_text_generation_json, updated_at)
VALUES ('default', 'openai', '', 'Clastro Demo is a neutral CMS starter brand. Outputs should be clear, structured, implementation-friendly, and easy to adapt for client sites.', ${json(aiSettings.imageGeneration)}, ${json(aiSettings.blogGeneration)}, ${json(aiSettings.altTextGeneration)}, CURRENT_TIMESTAMP);`,
  "INSERT INTO cms_feature_flags (id, show_ai_dashboard, show_blog, updated_at) VALUES ('default', 1, 1, CURRENT_TIMESTAMP);",
  "DELETE FROM pages;",
  ...pages.map((page) => `INSERT INTO pages (id, slug, title, description, lang, stylesheets_json, content_html, schema_json, published, updated_at)
VALUES (${sql(`page-${page.slug || "home"}`)}, ${sql(page.slug)}, ${sql(page.title)}, ${sql(page.description)}, 'en', '[]', ${sql(page.content.trim())}, NULL, 1, CURRENT_TIMESTAMP);`),
  "DELETE FROM posts;",
  ...posts.map((post) => `INSERT INTO posts (id, slug, title, excerpt, content_html, cover_image_url, cover_image_alt, featured, published, published_at, read_time, author_name, author_role, primary_category, categories_json, seo_title, seo_description, updated_at)
VALUES (${sql(`post-${post.slug}`)}, ${sql(post.slug)}, ${sql(post.title)}, ${sql(post.excerpt)}, ${sql(post.content)}, NULL, NULL, ${post.slug === "what-belongs-in-the-core-cms" ? 1 : 0}, 1, '2026-05-21T00:00:00.000Z', '4 min read', 'Clastro Editor', 'CMS Demo Author', ${sql(post.category)}, ${json([{ label: post.category }])}, ${sql(`${post.title} | Clastro Demo`)}, ${sql(post.excerpt)}, CURRENT_TIMESTAMP);`),
  "DELETE FROM products;",
  ...products.map((product) => `INSERT INTO products (id, slug, name, price, price_label, hero_image_url, hero_image_alt, short_description, is_front_page, meta_title, meta_description, category_slug, category_label, overview, best_for_json, spec_notes_json, content_html, product_images_json, published, updated_at)
VALUES (${sql(`product-${product.slug}`)}, ${sql(product.slug)}, ${sql(product.name)}, NULL, ${sql(product.priceLabel)}, '', '', ${sql(product.shortDescription)}, 1, ${sql(`${product.name} | Clastro Demo`)}, ${sql(product.shortDescription)}, 'cms-packages', ${sql(product.category)}, ${sql(product.overview)}, ${json(["Testing product cards", "Testing detail pages", "Testing CMS fields"])}, ${json(["This is a generic starter record."])}, ${sql(`<p>${product.overview}</p><h2>Editable product copy</h2><p>Update this rich text from the Products tab in the admin.</p>`)}, '[]', 1, CURRENT_TIMESTAMP);`),
];

await writeFile(outputPath, `${statements.join("\n\n")}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
