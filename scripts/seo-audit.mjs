const baseUrl = (process.env.SEO_AUDIT_BASE_URL || "http://localhost:4321").replace(/\/$/, "");

const staticRoutes = [
  "/",
  "/about",
  "/services",
  "/products",
  "/contact",
  "/blog",
];

function stripTags(value = "") {
  return String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value = "") {
  return String(value)
    .replaceAll("&amp;", "&")
    .replaceAll("&#39;", "'")
    .replaceAll("&quot;", '"')
    .replaceAll("&nbsp;", " ");
}

function readTitle(html) {
  return decodeEntities(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
}

function readDescription(html) {
  return decodeEntities(html.match(/<meta\s+name="description"\s+content="([\s\S]*?)"/i)?.[1] || "").trim();
}

function readCanonical(html) {
  return (html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1] || "").trim();
}

function readHeadings(tagName, html) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "gi"))].map((match) =>
    stripTags(match[1]),
  );
}

function countSchemaBlocks(html) {
  return [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>/gi)].length;
}

function countImagesMissingAlt(html) {
  const images = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const missingAlt = images.filter((image) => {
    if (!/\salt=(".*?"|'.*?')/i.test(image)) {
      return true;
    }
    return /\salt=(""|'')/i.test(image);
  }).length;

  return {
    total: images.length,
    missingAlt,
  };
}

function hasBadLength(length, min, max) {
  return length < min || length > max;
}

async function fetchJson(pathname) {
  const response = await fetch(`${baseUrl}${pathname}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${pathname}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function collectRoutes() {
  const [postsJson, productsJson] = await Promise.all([
    fetchJson("/api/posts"),
    fetchJson("/api/products"),
  ]);

  const posts = Array.isArray(postsJson) ? postsJson : Array.isArray(postsJson.docs) ? postsJson.docs : [];
  const products = Array.isArray(productsJson)
    ? productsJson
    : Array.isArray(productsJson.docs)
      ? productsJson.docs
      : [];

  return [...new Set([
    ...staticRoutes,
    ...posts.map((post) => `/blog/${post.slug}`),
    ...products.map((product) => `/products/${product.slug}`),
  ])];
}

async function auditRoute(route) {
  const response = await fetch(`${baseUrl}${route}`);
  const html = await response.text();
  const title = readTitle(html);
  const description = readDescription(html);
  const canonical = readCanonical(html);
  const h1s = readHeadings("h1", html);
  const h2s = readHeadings("h2", html);
  const schemaBlocks = countSchemaBlocks(html);
  const imageStats = countImagesMissingAlt(html);
  const issues = [];

  if (response.status !== 200) issues.push(`status-${response.status}`);
  if (!title) issues.push("missing-title");
  if (!description) issues.push("missing-description");
  if (!canonical) issues.push("missing-canonical");
  if (schemaBlocks === 0) issues.push("missing-schema");
  if (h1s.length !== 1) issues.push(`h1-count-${h1s.length}`);
  if (h2s.length === 0) issues.push("missing-h2");
  if (imageStats.missingAlt > 0) issues.push(`missing-alt-${imageStats.missingAlt}`);
  if (title && hasBadLength(title.length, 20, 65)) issues.push(`title-length-${title.length}`);
  if (description && hasBadLength(description.length, 80, 165)) issues.push(`description-length-${description.length}`);

  return {
    route,
    issues,
    title,
    titleLength: title.length,
    descriptionLength: description.length,
    canonical,
    h1s,
    h2Count: h2s.length,
    schemaBlocks,
    imageCount: imageStats.total,
    missingAlt: imageStats.missingAlt,
  };
}

async function main() {
  const routes = await collectRoutes();
  const results = [];

  for (const route of routes) {
    results.push(await auditRoute(route));
  }

  const issues = results.filter((result) => result.issues.length > 0);

  console.log(JSON.stringify({
    baseUrl,
    routeCount: routes.length,
    issueCount: issues.length,
    issues,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
