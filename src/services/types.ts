// src/services/types.ts
// Tipos que reflejan los modelos del backend (IDs como string por BigInt)

export type BillingCycle = 'weekly' | 'biweekly' | 'monthly';
export type TripType = 'ida' | 'vuelta' | 'ida y vuelta' | 'especial';
export type SummaryStatus = 'draft' | 'sent' | 'paid' | 'archived';

export interface Client {
  id: string;
  created_at: string;
  nombre: string;
  phone: string;
  billing_cycle: BillingCycle;
  billing_day?: number | null;
  billing_start_date?: string | null;
  routes?: Route[];
  summaries?: Summary[];
}

export interface Route {
  id: string;
  created_at: string;
  name?: string | null;
  client_id?: string | null;
  route_stops?: RouteStop[];
}

export interface RouteStop {
  id: string;
  created_at: string;
  address?: string | null;
  stop_order?: number | null;
  route_id?: string | null;
}

export interface Rate {
  id: string;
  created_at: string;
  client_id?: string | null;
  route_id?: string | null;
  base_price: string;
  surcharge_price?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface Trip {
  id: string;
  created_at: string;
  user_id: string;
  client_id: string;
  route_id: string;
  rate_id: string;
  trip_date: string;
  trip_type: TripType;
  final_price: string;
  has_surcharge: boolean;
  surcharge_reason?: string | null;
  special_type?: string | null;
  notes?: string | null;
  summary_id?: string | null;
  clients?: Client;
  routes?: Route;
  rates?: Rate;
}

export interface Summary {
  id: string;
  created_at?: string | null;
  client_id: string;
  driver_id: string;
  period_start: string;
  period_end: string;
  period_type: BillingCycle;
  total_trips: number;
  total_amount: string;
  status: SummaryStatus;
  sent_at?: string | null;
  paid_at?: string | null;
  archived_at?: string | null;
  whatsapp_msg?: string | null;
  notes?: string | null;
  clients?: Client;
  users?: {
    id: string;
    name: string;
  };
  trips?: Trip[];
}

export interface BillingPreview {
  client: string;
  billing_cycle: BillingCycle;
  period_start: string;
  period_end: string;
  period_type: BillingCycle;
  available_trips: number;
}

// --- DTOs de creación/actualización ---

export interface CreateTripDto {
  user_id: string;
  client_id: string;
  route_id: string;
  rate_id: string | null;
  trip_date: string;
  trip_type: TripType;
  final_price: number;
  has_surcharge?: boolean;
  surcharge_reason?: string;
  special_type?: string;
  notes?: string;
}

export type UpdateTripDto = Partial<CreateTripDto>;

export interface CreateClientDto {
  nombre: string;
  phone: string;
  billing_cycle: BillingCycle;
  billing_day?: number;
  billing_start_date?: string;
}

export type UpdateClientDto = Partial<CreateClientDto>;

export interface UpdateBillingDto {
  billing_cycle: BillingCycle;
  billing_day?: number;
  billing_start_date?: string;
}

export interface CreateSummaryManualDto {
  client_id: string;
  driver_id: string;
  period_start: string;
  period_end: string;
  notes?: string;
}

export interface UpdateSummaryStatusDto {
  status: SummaryStatus;
}

export interface CreateSummaryAutoDto {
  driver_id: string;
  notes?: string;
}

// --- Service Schedules ---

export interface ServiceSchedule {
  id: string;
  client_id: string;
  day_of_week: number;
  pickup_time: string;
  return_time: string | null;
  label: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduleDto {
  day_of_week: number;
  pickup_time: string;
  return_time?: string | null;
  label?: string | null;
  is_active?: boolean;
}

export type UpdateScheduleDto = Partial<CreateScheduleDto>;

export interface BulkSchedulesDto {
  schedules: CreateScheduleDto[];
}

// --- Itineraries (Recorridos) ---

export interface Itinerary {
  id: string;
  created_at: string;
  name: string;
  client_id: string;
  clients?: Client;
  stops?: ItineraryStop[];
  rates?: ItineraryRate[];
}

export interface ItineraryStop {
  id: string;
  created_at: string;
  itinerary_id: string;
  address: string;
  stop_order: number;
  lat?: number | null;
  lng?: number | null;
}

export type ItineraryRateType = 'ida' | 'ida y vuelta' | 'especial';

export interface ItineraryRate {
  id: string;
  created_at: string;
  itinerary_id: string;
  trip_type: ItineraryRateType;
  base_price: string;
  surcharge_price?: string | null;
  start_date?: string | null;
  end_date?: string | null;
}

export interface CreateItineraryDto {
  name: string;
  client_id: string;
}

export type UpdateItineraryDto = Partial<CreateItineraryDto>;

export interface CreateItineraryStopDto {
  address: string;
  stop_order?: number;
  lat?: number;
  lng?: number;
}

export type UpdateItineraryStopDto = Partial<CreateItineraryStopDto>;

export interface CreateItineraryRateDto {
  trip_type: ItineraryRateType;
  base_price: number;
  surcharge_price?: number;
  start_date?: string;
  end_date?: string;
}

export type UpdateItineraryRateDto = Partial<CreateItineraryRateDto>;

export interface ItineraryMatchPoint {
  lat: number;
  lng: number;
}

export interface ItineraryMatchDto {
  client_id: string;
  points: ItineraryMatchPoint[];
}

export interface ItineraryMatchResult {
  itinerary_id: string;
  name: string;
  distance_km: number;
  rate: ItineraryRate | null;
}
