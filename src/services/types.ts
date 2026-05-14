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
  trips?: Trip[];
}

export interface BillingPreview {
  period_start: string;
  period_end: string;
  period_type: BillingCycle;
}

// --- DTOs de creación/actualización ---

export interface CreateTripDto {
  user_id: string;
  client_id: string;
  route_id: string;
  rate_id: string;
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
}

export interface UpdateSummaryStatusDto {
  status: SummaryStatus;
}
