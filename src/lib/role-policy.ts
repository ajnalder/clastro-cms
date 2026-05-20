export type CmsRole = "super_admin" | "site_owner" | "editor" | "collaborator";

export const CMS_ROLE_OPTIONS: Array<{ description: string; label: string; value: CmsRole }> = [
  {
    value: "super_admin",
    label: "Super Admin",
    description: "Developer access with full control of the CMS.",
  },
  {
    value: "site_owner",
    label: "Site Owner",
    description: "Client owner access for managing the site and team.",
  },
  {
    value: "editor",
    label: "Editor",
    description: "Content editing access for day-to-day site updates.",
  },
  {
    value: "collaborator",
    label: "Collaborator",
    description: "Limited contributor access for SEO or blog support.",
  },
];

export function normalizeCmsRole(role: string | undefined | null): CmsRole {
  const normalized = String(role || "").trim().toLowerCase().replace(/-/g, "_");

  if (normalized === "super_admin" || normalized === "master") {
    return "super_admin";
  }

  if (normalized === "site_owner" || normalized === "owner" || normalized === "admin") {
    return "site_owner";
  }

  if (normalized === "collaborator") {
    return "collaborator";
  }

  return "editor";
}

export function formatCmsRole(role: string | undefined | null) {
  const option = CMS_ROLE_OPTIONS.find((entry) => entry.value === normalizeCmsRole(role));
  return option?.label || "Editor";
}

export function isSuperAdminRole(role: string | undefined | null) {
  return normalizeCmsRole(role) === "super_admin";
}

export function isSiteOwnerRole(role: string | undefined | null) {
  return normalizeCmsRole(role) === "site_owner";
}

export function canManageUsers(role: string | undefined | null) {
  const normalized = normalizeCmsRole(role);
  return normalized === "super_admin" || normalized === "site_owner";
}

export function canInviteUsers(role: string | undefined | null) {
  return canManageUsers(role);
}

export function assignableRolesFor(role: string | undefined | null): CmsRole[] {
  const normalized = normalizeCmsRole(role);

  if (normalized === "super_admin") {
    return CMS_ROLE_OPTIONS.map((entry) => entry.value);
  }

  if (normalized === "site_owner") {
    return ["editor", "collaborator"];
  }

  return [];
}

export function canAssignRole(actorRole: string | undefined | null, nextRole: string | undefined | null) {
  const assignable = assignableRolesFor(actorRole);
  return assignable.includes(normalizeCmsRole(nextRole));
}

export function canDeleteUser(input: {
  actorId: string;
  actorRole: string | undefined | null;
  targetId: string;
  targetRole: string | undefined | null;
}) {
  if (!canManageUsers(input.actorRole) || input.actorId === input.targetId) {
    return false;
  }

  const actorRole = normalizeCmsRole(input.actorRole);
  const targetRole = normalizeCmsRole(input.targetRole);

  if (actorRole === "super_admin") {
    return true;
  }

  return targetRole === "editor" || targetRole === "collaborator";
}

export function canUpdateUserRole(input: {
  actorId: string;
  actorRole: string | undefined | null;
  nextRole: string | undefined | null;
  targetId: string;
  targetRole: string | undefined | null;
}) {
  if (!canDeleteUser({
    actorId: input.actorId,
    actorRole: input.actorRole,
    targetId: input.targetId,
    targetRole: input.targetRole,
  })) {
    return false;
  }

  return canAssignRole(input.actorRole, input.nextRole);
}
