import { useState, useCallback } from 'react';
import { invitationsService } from '../../../services/invitations';
import type { InvitationCodeResult } from '../../../services/types';
import { useAuth } from '../../../state/AuthContext';
import { usePermissions } from '../../../permissions';

interface UseCreateInvitationReturn {
  result: InvitationCodeResult | null;
  loading: boolean;
  error: string | null;
  createInvitation: (clientId?: string | null) => Promise<InvitationCodeResult | null>;
  reset: () => void;
}

export function useCreateInvitation(): UseCreateInvitationReturn {
  const { userProfile } = useAuth();
  const permissions = usePermissions(userProfile);
  const [result, setResult] = useState<InvitationCodeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvitation = useCallback(async (clientId?: string | null) => {
    if (!permissions.can.invitations || (clientId && !permissions.canAccessClient(clientId))) {
      setError('No tienes permiso para generar invitaciones.');
      return null;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await invitationsService.create({ client_id: clientId ?? null });
      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error generando invitación';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [permissions]);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    result,
    loading,
    error,
    createInvitation,
    reset,
  };
}
