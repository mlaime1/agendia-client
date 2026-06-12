import { useState, useEffect, useCallback } from 'react';
import { itinerariesService } from '../../../services/itineraries';
import type { Itinerary, ItineraryStop, ItineraryRate } from '../../../services/types';

interface UseItineraryDetailReturn {
  itinerary: Itinerary | null;
  stops: ItineraryStop[];
  rates: ItineraryRate[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  deleteItinerary: () => Promise<void>;
}

export function useItineraryDetail(itineraryId: string): UseItineraryDetailReturn {
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [stops, setStops] = useState<ItineraryStop[]>([]);
  const [rates, setRates] = useState<ItineraryRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItinerary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [itineraryData, stopsData, ratesData] = await Promise.all([
        itinerariesService.getById(itineraryId),
        itinerariesService.getStops(itineraryId),
        itinerariesService.getRates(itineraryId),
      ]);

      setItinerary(itineraryData);
      setStops(stopsData);
      setRates(ratesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar recorrido');
    } finally {
      setLoading(false);
    }
  }, [itineraryId]);

  useEffect(() => {
    fetchItinerary();
  }, [fetchItinerary]);

  const deleteItinerary = async () => {
    await itinerariesService.remove(itineraryId);
    setItinerary(null);
    setStops([]);
    setRates([]);
  };

  return {
    itinerary,
    stops,
    rates,
    loading,
    error,
    refetch: fetchItinerary,
    deleteItinerary,
  };
}
