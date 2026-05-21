import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("site footer keeps breathing room below the base text", async () => {
  const componentsCss = await readFile(
    new URL("../src/styles/components.css", import.meta.url),
    "utf8",
  );

  const footerBlock = componentsCss.match(/\.site-footer\s*{[^}]+}/)?.[0] ?? "";

  assert.match(footerBlock, /padding-bottom:\s*max\(2rem,\s*env\(safe-area-inset-bottom,\s*0px\)\)/);
});
