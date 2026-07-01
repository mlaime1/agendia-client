import { useMemo } from 'react';

import { useAuth } from '../../../state/AuthContext';

type CalendarPermissions = {
  canEdit: boolean;
  canCreateRegularTrips: boolean;
  canCreateSpecialTrips: boolean;
  canCreateAnyTrip: boolean;
  canSetPrice: boolean;
  canDeleteTrips: boolean;
  showClientSelector: boolean;
  resolvedClientId: string | undefined;
};

export const useCalendarPermissions = (
  _clients: { id: string; name: string }[],
  selectedClientId?: string,
): CalendarPermissions => {
  const { userProfile } = useAuth();
  const role = userProfile?.role;
  const linkedClientId = userProfile?.linked_client_id;

  return useMemo(() => {
    const isDriver = role === 'driver' || role === 'admin';
    const isClient = role === 'client';

    const canCreateRegularTrips = isDriver || isClient;
    const canCreateSpecialTrips = isDriver || isClient;
    const canCreateAnyTrip = canCreateRegularTrips || canCreateSpecialTrips;

    const resolvedClientId = isDriver
      ? selectedClientId
      : isClient
        ? linkedClientId || undefined
        : undefined;

    return {
      canEdit: isDriver,
      canCreateRegularTrips,
      canCreateSpecialTrips,
      canCreateAnyTrip,
      canSetPrice: isDriver,
      canDeleteTrips: isDriver,
      showClientSelector: isDriver,
      resolvedClientId,
    };
  }, [role, linkedClientId, selectedClientId]);
};
