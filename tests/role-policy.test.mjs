import assert from "node:assert/strict";
import test from "node:test";

async function importRolePolicy() {
  const rolePolicyUrl = new URL("../src/lib/role-policy.ts", import.meta.url);
  return import(`${rolePolicyUrl.href}?cache=${Date.now()}`);
}

test("role policy normalizes legacy and new CMS roles", async () => {
  const { normalizeCmsRole } = await importRolePolicy();

  assert.equal(normalizeCmsRole("super-admin"), "super_admin");
  assert.equal(normalizeCmsRole("owner"), "site_owner");
  assert.equal(normalizeCmsRole("admin"), "site_owner");
  assert.equal(normalizeCmsRole("collaborator"), "collaborator");
  assert.equal(normalizeCmsRole("something-unknown"), "editor");
});

test("super admins can assign every supported role", async () => {
  const { CMS_ROLE_OPTIONS, canAssignRole } = await importRolePolicy();

  assert.deepEqual(
    CMS_ROLE_OPTIONS.map((role) => role.value),
    ["super_admin", "site_owner", "editor", "collaborator"],
  );
  assert.equal(canAssignRole("super_admin", "super_admin"), true);
  assert.equal(canAssignRole("super_admin", "site_owner"), true);
  assert.equal(canAssignRole("super_admin", "editor"), true);
  assert.equal(canAssignRole("super_admin", "collaborator"), true);
});

test("site owners can only assign editor and collaborator roles", async () => {
  const { canAssignRole } = await importRolePolicy();

  assert.equal(canAssignRole("site_owner", "super_admin"), false);
  assert.equal(canAssignRole("site_owner", "site_owner"), false);
  assert.equal(canAssignRole("site_owner", "editor"), true);
  assert.equal(canAssignRole("site_owner", "collaborator"), true);
});

test("site owners can manage users without touching super admins", async () => {
  const { canDeleteUser, canUpdateUserRole } = await importRolePolicy();

  assert.equal(canDeleteUser({ actorId: "owner", actorRole: "site_owner", targetId: "super", targetRole: "super_admin" }), false);
  assert.equal(canDeleteUser({ actorId: "owner", actorRole: "site_owner", targetId: "editor", targetRole: "editor" }), true);
  assert.equal(canDeleteUser({ actorId: "owner", actorRole: "site_owner", targetId: "collab", targetRole: "collaborator" }), true);
  assert.equal(canDeleteUser({ actorId: "owner", actorRole: "site_owner", targetId: "owner", targetRole: "site_owner" }), false);

  assert.equal(canUpdateUserRole({
    actorId: "owner",
    actorRole: "site_owner",
    nextRole: "collaborator",
    targetId: "editor",
    targetRole: "editor",
  }), true);
  assert.equal(canUpdateUserRole({
    actorId: "owner",
    actorRole: "site_owner",
    nextRole: "site_owner",
    targetId: "editor",
    targetRole: "editor",
  }), false);
});

test("editors and collaborators cannot manage users", async () => {
  const { canDeleteUser, canInviteUsers, canUpdateUserRole } = await importRolePolicy();

  assert.equal(canInviteUsers("editor"), false);
  assert.equal(canInviteUsers("collaborator"), false);
  assert.equal(canDeleteUser({ actorId: "editor", actorRole: "editor", targetId: "collab", targetRole: "collaborator" }), false);
  assert.equal(canUpdateUserRole({
    actorId: "collab",
    actorRole: "collaborator",
    nextRole: "editor",
    targetId: "editor",
    targetRole: "editor",
  }), false);
});
