import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(tmpdir(), "cms-permissions-"));
const outdir = path.join(tempDir, "bundle");

try {
  await mkdir(outdir, { recursive: true });
  await build({
    bundle: true,
    entryPoints: ["src/lib/auth.ts"],
    format: "esm",
    outfile: path.join(outdir, "auth.mjs"),
    platform: "node",
    plugins: [
      {
        name: "cloudflare-workers-shim",
        setup(buildApi) {
          buildApi.onResolve({ filter: /^cloudflare:workers$/ }, () => ({
            namespace: "cloudflare-workers-shim",
            path: "cloudflare:workers",
          }));
          buildApi.onLoad({ filter: /.*/, namespace: "cloudflare-workers-shim" }, () => ({
            contents: "export const env = {};",
            loader: "js",
          }));
        },
      },
    ],
  });

  const auth = await import(path.join(outdir, "auth.mjs"));

  assert.equal(auth.normalizeCmsUserRole("super_admin"), "super_admin");
  assert.equal(auth.normalizeCmsUserRole("super-admin"), "super_admin");
  assert.equal(auth.normalizeCmsUserRole("owner"), "super_admin");
  assert.equal(auth.normalizeCmsUserRole("master"), "super_admin");
  assert.equal(auth.normalizeCmsUserRole("admin"), "admin");
  assert.equal(auth.normalizeCmsUserRole("editor"), "editor");
  assert.equal(auth.normalizeCmsUserRole("unknown"), "editor");

  assert.equal(auth.isSuperAdminRole("super_admin"), true);
  assert.equal(auth.isSuperAdminRole("owner"), true);
  assert.equal(auth.isSuperAdminRole("admin"), false);
  assert.equal(auth.isAdminRole("admin"), true);
  assert.equal(auth.isAdminRole("super_admin"), true);
  assert.equal(auth.isAdminRole("editor"), false);
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
