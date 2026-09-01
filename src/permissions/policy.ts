import type { UserProfile, UserRole } from "../features/auth/types/user";
import type { Permission, PermissionContext, PermissionPolicy, PermissionSet } from "./types";

const ALL_PERMISSIONS: PermissionSet = {
  dashboard: true,
  clients: true,
  clientCreation: true,
  clientEditing: true,
  invitations: true,
  calendar: true,
  trips: true,
  summaries: true,
  summaryManagement: true,
  payments: true,
};

const DRIVER_PERMISSIONS: PermissionSet = {
  ...ALL_PERMISSIONS,
};

const CLIENT_PERMISSIONS: PermissionSet = {
  dashboard: true,
  clients: false,
  clientCreation: false,
  clientEditing: false,
  invitations: false,
  calendar: true,
  trips: false,
  summaries: true,
  summaryManagement: false,
  payments: false,
};

const NO_PERMISSIONS: PermissionSet = {
  dashboard: false,
  clients: false,
  clientCreation: false,
  clientEditing: false,
  invitations: false,
  calendar: false,
  trips: false,
  summaries: false,
  summaryManagement: false,
  payments: false,
};

const permissionsForRole = (role: UserRole | null | undefined): PermissionSet => {
  switch (role) {
    case "admin":
      return ALL_PERMISSIONS;
    case "driver":
      return DRIVER_PERMISSIONS;
    case "client":
      return CLIENT_PERMISSIONS;
    default:
      return NO_PERMISSIONS;
  }
};

export function createPermissionPolicy({ role, profile }: PermissionContext): PermissionPolicy {
  const can = permissionsForRole(role);
  const linkedClientId = profile?.linked_client_id ?? null;

  return {
    can,
    isResolved: role !== null && role !== undefined && role !== "unknown",
    canAccessClient: (clientId: string) => role !== "client" || Boolean(linkedClientId && clientId === linkedClientId),
  };
}

export function createPermissionPolicyForProfile(profile: UserProfile | null | undefined) {
  return createPermissionPolicy({ role: profile?.role, profile });
}

export type { Permission };
