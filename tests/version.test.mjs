import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function importVersionModule() {
  const versionUrl = new URL("../src/lib/version.ts", import.meta.url);
  return import(`${versionUrl.href}?cache=${Date.now()}`);
}

test("Clastro version metadata matches the package version and latest changelog entry", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../package.json", import.meta.url), "utf8"),
  );
  const { CLASTRO_CHANGELOG, CLASTRO_VERSION } = await importVersionModule();

  assert.equal(CLASTRO_VERSION, packageJson.version);
  assert.equal(CLASTRO_CHANGELOG[0].version, CLASTRO_VERSION);
  assert.match(CLASTRO_VERSION, CLASSIC_SEMVER_PATTERN);
});

const CLASSIC_SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;
