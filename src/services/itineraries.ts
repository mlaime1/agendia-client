import { api } from './backendApi';
import type {
  Itinerary,
  ItineraryStop,
  ItineraryRate,
  CreateItineraryDto,
  UpdateItineraryDto,
  CreateItineraryStopDto,
  UpdateItineraryStopDto,
  CreateItineraryRateDto,
  UpdateItineraryRateDto,
  ItineraryMatchDto,
  ItineraryMatchResult,
} from './types';

export const itinerariesService = {
  getAll(): Promise<Itinerary[]> {
    return api.get<Itinerary[]>('/itineraries');
  },

  getById(id: string): Promise<Itinerary> {
    return api.get<Itinerary>(`/itineraries/${id}`);
  },

  create(body: CreateItineraryDto): Promise<Itinerary> {
    return api.post<Itinerary>('/itineraries', body);
  },

  update(id: string, body: UpdateItineraryDto): Promise<Itinerary> {
    return api.patch<Itinerary>(`/itineraries/${id}`, body);
  },

  remove(id: string): Promise<void> {
    return api.delete<void>(`/itineraries/${id}`);
  },

  // ── Stops ──────────────────────────────────────────────

  getStops(itineraryId: string): Promise<ItineraryStop[]> {
    return api.get<ItineraryStop[]>(`/itineraries/${itineraryId}/stops`);
  },

  addStop(itineraryId: string, body: CreateItineraryStopDto): Promise<ItineraryStop> {
    return api.post<ItineraryStop>(`/itineraries/${itineraryId}/stops`, body);
  },

  updateStop(
    itineraryId: string,
    stopId: string,
    body: UpdateItineraryStopDto,
  ): Promise<ItineraryStop> {
    return api.patch<ItineraryStop>(`/itineraries/${itineraryId}/stops/${stopId}`, body);
  },

  removeStop(itineraryId: string, stopId: string): Promise<void> {
    return api.delete<void>(`/itineraries/${itineraryId}/stops/${stopId}`);
  },

  // ── Rates ──────────────────────────────────────────────

  getRates(itineraryId: string): Promise<ItineraryRate[]> {
    const url = `/itineraries/${itineraryId}/rates`;
    console.log('[itinerariesService.getRates] GET', url);
    return api.get<ItineraryRate[]>(url);
  },

  addRate(itineraryId: string, body: CreateItineraryRateDto): Promise<ItineraryRate> {
    return api.post<ItineraryRate>(`/itineraries/${itineraryId}/rates`, body);
  },

  updateRate(
    itineraryId: string,
    rateId: string,
    body: UpdateItineraryRateDto,
  ): Promise<ItineraryRate> {
    return api.patch<ItineraryRate>(`/itineraries/${itineraryId}/rates/${rateId}`, body);
  },

  removeRate(itineraryId: string, rateId: string): Promise<void> {
    return api.delete<void>(`/itineraries/${itineraryId}/rates/${rateId}`);
  },

  // ── Match ──────────────────────────────────────────────

  match(body: ItineraryMatchDto): Promise<ItineraryMatchResult> {
    return api.post<ItineraryMatchResult>('/itineraries/match', body);
  },
};
