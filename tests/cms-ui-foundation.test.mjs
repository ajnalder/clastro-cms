import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function read(path) {
  return readFile(new URL(path, import.meta.url), "utf8");
}

test("CMS has a shadcn-compatible Tailwind foundation", async () => {
  const packageJson = JSON.parse(await read("../package.json"));
  const componentsConfig = await read("../components.json");
  const utils = await read("../src/lib/utils.ts");
  const button = await read("../src/components/ui/button.tsx");
  const card = await read("../src/components/ui/card.tsx");
  const globalCss = await read("../src/styles/global.css");
  const adminPage = await read("../src/pages/admin/index.astro");

  assert.match(componentsConfig, /"style": "new-york"/);
  assert.match(componentsConfig, /"css": "src\/styles\/global.css"/);
  assert.match(componentsConfig, /"ui": "src\/components\/ui"/);
  assert.equal(packageJson.dependencies["class-variance-authority"], "^0.7.1");
  assert.match(packageJson.dependencies["tailwind-merge"], /^\^3\./);
  assert.equal(packageJson.dependencies["@radix-ui/react-slot"], "^1.2.4");
  assert.match(utils, /twMerge\(clsx\(inputs\)\)/);
  assert.match(button, /buttonVariants/);
  assert.match(button, /variant: \{/);
  assert.match(card, /CardHeader/);
  assert.match(globalCss, /--radius-sm:/);
  assert.match(globalCss, /--color-primary:/);
  assert.match(adminPage, /styles\/global\.css/);
});

test("admin shared controls use Tailwind-backed shadcn surface tokens", async () => {
  const adminCss = await read("../src/components/admin/AdminApp.module.css");

  assert.match(adminCss, /@reference ['"]\.\.\/\.\.\/styles\/global\.css['"];/);
  assert.match(adminCss, /\.primaryButton[\s\S]*@apply[\s\S]*bg-primary[\s\S]*text-primary-foreground/);
  assert.match(adminCss, /\.secondaryButton[\s\S]*@apply[\s\S]*bg-background[\s\S]*border-input/);
  assert.match(adminCss, /\.dangerButton[\s\S]*@apply[\s\S]*bg-destructive[\s\S]*text-white/);
  assert.match(adminCss, /\.sectionCard[\s\S]*@apply[\s\S]*rounded-lg[\s\S]*border-border/);
  assert.match(adminCss, /\.field[\s\S]*@apply[\s\S]*gap-2/);
});

test("admin shell offers a persisted light and dark theme option", async () => {
  const adminApp = await read("../src/components/admin/AdminApp.tsx");
  const adminCss = await read("../src/components/admin/AdminApp.module.css");
  const globalCss = await read("../src/styles/global.css");

  // State + persistence
  assert.match(adminApp, /clastro-admin-theme/);
  assert.match(adminApp, /themeMode/);
  assert.match(adminApp, /setThemeMode\('light'\)/);
  assert.match(adminApp, /setThemeMode\('dark'\)/);
  assert.match(adminApp, /data-theme=\{themeMode\}/);
  assert.match(adminApp, /Light/);
  assert.match(adminApp, /Dark/);

  // Dark mode applies the `dark` class so shadcn tokens flip, plus the
  // admin-specific `themeLight` / `themeDark` classes for legacy CSS module overrides.
  assert.match(adminApp, /themeMode === 'dark' && 'dark'/);
  assert.match(adminApp, /styles\.themeDark/);
  assert.match(adminApp, /styles\.themeLight/);
  assert.match(adminCss, /\.themeLight/);
  assert.match(adminCss, /\.themeDark/);

  // Dark-mode token set lives in global.css (single source of truth for shadcn tokens).
  assert.match(globalCss, /\.dark\s*\{/);
  assert.match(globalCss, /--background:\s*#0a1228/);
  assert.match(globalCss, /--primary:\s*#22d3ee/);
});
