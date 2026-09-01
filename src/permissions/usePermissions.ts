import { useMemo } from "react";

import type { UserProfile } from "../features/auth/types/user";
import { createPermissionPolicyForProfile } from "./policy";

export function usePermissions(profile: UserProfile | null | undefined) {
  return useMemo(() => createPermissionPolicyForProfile(profile), [profile]);
}
