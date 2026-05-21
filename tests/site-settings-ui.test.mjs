import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("site settings shows friendly brand and sharing fields instead of raw shared JSON", async () => {
  const adminApp = await readFile(
    new URL("../src/components/admin/AdminApp.tsx", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(adminApp, /Structured JSON/);
  assert.doesNotMatch(adminApp, /Navigation JSON/);
  assert.doesNotMatch(adminApp, /Footer JSON/);
  assert.doesNotMatch(adminApp, /Booking modal JSON/);
  assert.doesNotMatch(adminApp, /Favicon URL/);
  assert.doesNotMatch(adminApp, /Apple touch icon URL/);
  assert.doesNotMatch(adminApp, /Default OG image URL/);
  assert.match(adminApp, /<h2>Brand & Sharing<\/h2>/);
  assert.match(adminApp, /BrandAssetField/);
  assert.match(adminApp, /Favicon/);
  assert.match(adminApp, /Apple touch icon/);
  assert.match(adminApp, /Social share image/);
  assert.match(adminApp, /Recommended: SVG, PNG, or ICO; 32 x 32 px minimum; keep it simple and square\./);
  assert.match(adminApp, /Recommended: 180 x 180 px PNG; square with clear padding for mobile home screens\./);
  assert.match(adminApp, /Recommended: 1200 x 630 px JPG or PNG; keep key text and logos centred\./);
  assert.match(adminApp, /Upload/);
  assert.match(adminApp, /Change/);
  assert.match(adminApp, /Default social share title/);
  assert.match(adminApp, /Default social share description/);
  assert.match(adminApp, /Browser theme colour/);
});

test("site layout renders global favicon, web clip, social defaults, and theme colour", async () => {
  const siteLayout = await readFile(
    new URL("../src/layouts/SiteLayout.astro", import.meta.url),
    "utf8",
  );
  const defaults = await readFile(
    new URL("../src/lib/defaults.ts", import.meta.url),
    "utf8",
  );
  const repository = await readFile(
    new URL("../src/lib/repository.ts", import.meta.url),
    "utf8",
  );

  assert.match(defaults, /faviconUrl:\s*"/);
  assert.match(defaults, /appleTouchIconUrl:\s*"/);
  assert.match(defaults, /socialShareTitle:\s*"/);
  assert.match(defaults, /socialShareDescription:\s*"/);
  assert.match(defaults, /themeColor:\s*"/);
  assert.match(siteLayout, /rel="apple-touch-icon"/);
  assert.match(siteLayout, /name="theme-color"/);
  assert.match(siteLayout, /siteSettings\.socialShareTitle/);
  assert.match(siteLayout, /siteSettings\.socialShareDescription/);
  assert.match(repository, /favicon_url/);
  assert.match(repository, /apple_touch_icon_url/);
  assert.match(repository, /social_share_title/);
  assert.match(repository, /social_share_description/);
  assert.match(repository, /theme_color/);
});
