import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("AI settings offers clear stored API key as a button beside the key field", async () => {
  const adminApp = await readFile(
    new URL("../src/components/admin/AdminApp.tsx", import.meta.url),
    "utf8",
  );
  const adminCss = await readFile(
    new URL("../src/components/admin/AdminApp.module.css", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(adminApp, /Clear stored API key/);
  assert.match(adminApp, /styles\.apiKeyInputRow/);
  assert.match(adminApp, /<button[\s\S]*Clear key[\s\S]*<\/button>/);
  assert.match(adminApp, /clearApiKey:\s*true/);
  assert.match(adminApp, /If you wish to update your key, paste a new key here and save AI settings\./);
  assert.match(adminCss, /\.apiKeyInputRow/);
});
