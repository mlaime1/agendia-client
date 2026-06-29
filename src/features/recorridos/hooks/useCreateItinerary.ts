import { useState, useCallback } from 'react';
import { itinerariesService } from '../../../services/itineraries';
import type { Itinerary, ItineraryStop, ItineraryRate, CreateItineraryDto } from '../../../services/types';

interface UseCreateItineraryReturn {
  creating: boolean;
  error: string | null;
  create: (
    itineraryData: CreateItineraryDto,
    stops: Array<{ address: string; stop_order: number; lat?: number; lng?: number }>,
    rates: Array<{ trip_type: string; base_price: number; surcharge_price?: number; start_date?: string; end_date?: string }>,
  ) => Promise<Itinerary>;
}

export function useCreateItinerary(): UseCreateItineraryReturn {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(
    async (
      itineraryData: CreateItineraryDto,
      stops: Array<{ address: string; stop_order: number; lat?: number; lng?: number }>,
      rates: Array<{ trip_type: string; base_price: number; surcharge_price?: number; start_date?: string; end_date?: string }>,
    ) => {
      setCreating(true);
      setError(null);

      try {
        const itinerary = await itinerariesService.create(itineraryData);

        const stopPromises = stops.map((stop) =>
          itinerariesService.addStop(itinerary.id, stop),
        );
        const createdStops = await Promise.all(stopPromises);

        const ratePromises = rates.map((rate) =>
          itinerariesService.addRate(itinerary.id, rate as Parameters<typeof itinerariesService.addRate>[1]),
        );
        const createdRates = await Promise.all(ratePromises);

        return {
          ...itinerary,
          stops: createdStops,
          rates: createdRates,
        } as Itinerary;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear recorrido';
        setError(message);
        throw err;
      } finally {
        setCreating(false);
      }
    },
    [],
  );

  return { creating, error, create };
}
