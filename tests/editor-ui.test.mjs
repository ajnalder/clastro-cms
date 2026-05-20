import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("visual editor preserves public spacing inside rich text groups", async () => {
  const bridge = await readFile(
    new URL("../src/components/recovered/RecoveredPageEditorBridge.astro", import.meta.url),
    "utf8",
  );

  assert.match(bridge, /hero-copy\s+\.visual-editor-rich-group\s*>\s*p:not\(\.eyebrow\)/);
  assert.match(bridge, /visual-editor-rich-group\s*>\s*:where\(h1,\s*h2,\s*h3/);
});

test("media library upload form supports selecting and uploading multiple files", async () => {
  const adminApp = await readFile(
    new URL("../src/components/admin/AdminApp.tsx", import.meta.url),
    "utf8",
  );

  assert.match(adminApp, /<input[^>]*name="file"/s);
  assert.match(adminApp, /<input[^>]*multiple/s);
  assert.match(adminApp, /Array\.from\(fileInput\?\.files\s*\|\|\s*\[\]\)/);
  assert.match(adminApp, /for \(const file of files\)/);
});
