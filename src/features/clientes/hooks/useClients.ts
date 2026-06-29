import { useState, useEffect, useCallback } from 'react';
import { clientsService } from '../../../services/clients';
import type { Client } from '../../../services/types';

interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createClient: (data: Parameters<typeof clientsService.create>[0]) => Promise<Client>;
  updateClient: (id: string, data: Parameters<typeof clientsService.update>[1]) => Promise<Client>;
  deleteClient: (id: string) => Promise<void>;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await clientsService.getAll();
      setClients(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const createClient = async (data: Parameters<typeof clientsService.create>[0]) => {
    const newClient = await clientsService.create(data);
    setClients((prev) => [...prev, newClient]);
    return newClient;
  };

  const updateClient = async (id: string, data: Parameters<typeof clientsService.update>[1]) => {
    const updated = await clientsService.update(id, data);
    setClients((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteClient = async (id: string) => {
    await clientsService.remove(id);
    setClients((prev) => prev.filter((c) => c.id !== id));
  };

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    createClient,
    updateClient,
    deleteClient,
  };
}
