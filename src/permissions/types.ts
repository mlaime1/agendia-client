import type { UserProfile, UserRole } from "../features/auth/types/user";

export type Permission =
  | "dashboard"
  | "clients"
  | "clientCreation"
  | "clientEditing"
  | "invitations"
  | "calendar"
  | "trips"
  | "summaries"
  | "summaryManagement"
  | "payments";

export type PermissionSet = Readonly<Record<Permission, boolean>>;

export type PermissionContext = {
  role: UserRole | null | undefined;
  profile?: Pick<UserProfile, "linked_client_id"> | null;
};

export type PermissionPolicy = {
  can: PermissionSet;
  isResolved: boolean;
  canAccessClient: (clientId: string) => boolean;
};
