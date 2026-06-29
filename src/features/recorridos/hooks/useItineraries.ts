import { useState, useEffect, useCallback } from 'react';
import { itinerariesService } from '../../../services/itineraries';
import type { Itinerary } from '../../../services/types';

interface UseItinerariesReturn {
  itineraries: Itinerary[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createItinerary: (data: Parameters<typeof itinerariesService.create>[0]) => Promise<Itinerary>;
  updateItinerary: (id: string, data: Parameters<typeof itinerariesService.update>[1]) => Promise<Itinerary>;
  deleteItinerary: (id: string) => Promise<void>;
}

export function useItineraries(): UseItinerariesReturn {
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItineraries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await itinerariesService.getAll();
      setItineraries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recorridos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItineraries();
  }, [fetchItineraries]);

  const createItinerary = async (data: Parameters<typeof itinerariesService.create>[0]) => {
    const newItinerary = await itinerariesService.create(data);
    setItineraries((prev) => [...prev, newItinerary]);
    return newItinerary;
  };

  const updateItinerary = async (id: string, data: Parameters<typeof itinerariesService.update>[1]) => {
    const updated = await itinerariesService.update(id, data);
    setItineraries((prev) => prev.map((i) => (i.id === id ? updated : i)));
    return updated;
  };

  const deleteItinerary = async (id: string) => {
    await itinerariesService.remove(id);
    setItineraries((prev) => prev.filter((i) => i.id !== id));
  };

  return {
    itineraries,
    loading,
    error,
    refetch: fetchItineraries,
    createItinerary,
    updateItinerary,
    deleteItinerary,
  };
}
