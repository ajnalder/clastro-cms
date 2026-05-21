import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin feature visibility controls live on user access cards", async () => {
  const adminApp = await readFile(
    new URL("../src/components/admin/AdminApp.tsx", import.meta.url),
    "utf8",
  );
  const adminCss = await readFile(
    new URL("../src/components/admin/AdminApp.module.css", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(adminApp, /Super Admin Controls/);
  assert.doesNotMatch(adminApp, /Show AI dashboard and AI settings to non-super-admin logins/);
  assert.doesNotMatch(adminApp, /Manage access/);
  assert.doesNotMatch(adminApp, /Close access/);
  assert.match(adminApp, /expandedUserAccessId/);
  assert.match(adminApp, /userAccessDrafts/);
  assert.match(adminApp, /IconEditSmall/);
  assert.doesNotMatch(adminApp, /IconSaveSmall/);
  assert.match(adminApp, /Save changes/);
  assert.match(adminApp, /saveManagedUserAccessDraft/);
  assert.match(adminApp, /styles\.userAccessIconButton/);
  assert.match(adminApp, /styles\.userAccessSaveButton/);
  assert.match(adminApp, /styles\.userAccessPanel/);
  assert.match(adminApp, /Feature visibility/);
  assert.match(adminApp, /Show AI settings/);
  assert.match(adminApp, /Show AI blog tools/);
  assert.match(adminApp, /Show LinkedIn tools/);
  assert.match(adminApp, /\/api\/users\/\$\{encodeURIComponent\(entry\.id\)\}\/features/);
  assert.match(adminCss, /\.userAccessPanel/);
  assert.match(adminCss, /\.userAccessSaveButton/);
});

test("invite user form keeps help text out of the role control row", async () => {
  const adminApp = await readFile(
    new URL("../src/components/admin/AdminApp.tsx", import.meta.url),
    "utf8",
  );

  assert.match(adminApp, /styles\.inviteHelpText/);
  assert.doesNotMatch(adminApp, /<small className=\{styles\.fieldHint\}>Invite links are one-time setup links\./);
});

test("invite links are created with feature visibility before the client accepts", async () => {
  const adminApp = await readFile(
    new URL("../src/components/admin/AdminApp.tsx", import.meta.url),
    "utf8",
  );
  const repository = await readFile(
    new URL("../src/lib/repository.ts", import.meta.url),
    "utf8",
  );
  const api = await readFile(
    new URL("../src/pages/api/[...path].ts", import.meta.url),
    "utf8",
  );
  const schema = await readFile(
    new URL("../db/schema.sql", import.meta.url),
    "utf8",
  );

  assert.match(adminApp, /inviteDraft\.featureVisibility/);
  assert.match(adminApp, /Configure access before creating the invite link/);
  assert.match(adminApp, /Prepared access/);
  assert.match(adminApp, /generatedInviteId/);
  assert.match(adminApp, /copyToClipboard\(generatedInviteUrl, 'Invite link copied\.'\)/);
  assert.match(api, /featureVisibility:\s*normalizeFeatureVisibility\(body\?\.featureVisibility\)/);
  assert.match(api, /upsertCmsUserFeatureVisibility\(context\.locals,\s*userId,\s*invitation\.featureVisibility\)/);
  assert.match(repository, /show_ai_settings/);
  assert.match(repository, /show_ai_blog_tools/);
  assert.match(repository, /show_linkedin/);
  assert.match(schema, /show_ai_settings INTEGER NOT NULL DEFAULT 1/);
  assert.match(schema, /show_ai_blog_tools INTEGER NOT NULL DEFAULT 1/);
  assert.match(schema, /show_linkedin INTEGER NOT NULL DEFAULT 1/);
});

test("user feature visibility is stored per user", async () => {
  const repository = await readFile(
    new URL("../src/lib/repository.ts", import.meta.url),
    "utf8",
  );
  const api = await readFile(
    new URL("../src/pages/api/[...path].ts", import.meta.url),
    "utf8",
  );

  assert.match(repository, /user_feature_visibility/);
  assert.match(repository, /show_ai_settings/);
  assert.match(repository, /show_ai_blog_tools/);
  assert.match(repository, /show_linkedin/);
  assert.match(api, /getCmsUserFeatureVisibility/);
  assert.match(api, /upsertCmsUserFeatureVisibility/);
});
