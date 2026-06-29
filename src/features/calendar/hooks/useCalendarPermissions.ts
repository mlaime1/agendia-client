import { useMemo } from 'react';

import { useAuth } from '../../../state/AuthContext';

type CalendarPermissions = {
  canEdit: boolean;
  canCreateRegularTrips: boolean;
  canCreateSpecialTrips: boolean;
  canSetPrice: boolean;
  canDeleteTrips: boolean;
  showClientSelector: boolean;
  resolvedClientId: string | undefined;
};

export const useCalendarPermissions = (
  clients: { id: string; name: string }[],
  selectedClientId?: string,
): CalendarPermissions => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const linkedClientId = userProfile?.linked_client_id;

  return useMemo(() => {
    const isDriver = role === 'driver' || role === 'admin';
    const isClient = role === 'client';

    const resolvedClientId = isDriver
      ? selectedClientId
      : isClient
        ? linkedClientId || undefined
        : selectedClientId;

    return {
      canEdit: isDriver,
      canCreateRegularTrips: isDriver,
      canCreateSpecialTrips: true,
      canSetPrice: isDriver,
      canDeleteTrips: isDriver,
      showClientSelector: isDriver,
      resolvedClientId,
    };
  }, [role, linkedClientId, selectedClientId]);
};
