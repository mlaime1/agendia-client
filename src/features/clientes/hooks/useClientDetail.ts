import { useState, useEffect, useCallback } from 'react';
import { clientsService } from '../../../services/clients';
import type { Client } from '../../../services/types';

interface UseClientDetailReturn {
  client: Client | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateClient: (data: Parameters<typeof clientsService.update>[1]) => Promise<Client>;
  updateBilling: (data: Parameters<typeof clientsService.updateBilling>[1]) => Promise<Client>;
}

export function useClientDetail(clientId: string | null): UseClientDetailReturn {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setClient(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await clientsService.getById(clientId);
      setClient(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar cliente');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const updateClient = async (data: Parameters<typeof clientsService.update>[1]) => {
    if (!clientId) throw new Error('No hay cliente seleccionado');
    const updated = await clientsService.update(clientId, data);
    setClient(updated);
    return updated;
  };

  const updateBilling = async (data: Parameters<typeof clientsService.updateBilling>[1]) => {
    if (!clientId) throw new Error('No hay cliente seleccionado');
    const updated = await clientsService.updateBilling(clientId, data);
    setClient(updated);
    return updated;
  };

  return {
    client,
    loading,
    error,
    refetch: fetchClient,
    updateClient,
    updateBilling,
  };
}
