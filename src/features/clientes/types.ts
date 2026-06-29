import type { BillingCycle } from '../../services/types';

export interface ServiceSchedule {
  id: string;
  day_of_week: number;
  pickup_time: string;
  return_time: string | null;
  label: string | null;
  is_active: boolean;
}

export interface Responsible {
  id: string;
  name: string;
  relationship: string;
  status: 'linked' | 'pending';
}

export interface ClientFull {
  id: string;
  nombre: string;
  phone: string;
  address: string;
  observations: string;
  billing_cycle: BillingCycle;
  billing_day: number | null;
  billing_start_date: string | null;
  timezone?: string | null;
  is_active: boolean;
  schedules: ServiceSchedule[];
  responsibles: Responsible[];
}

export type ClientNavigationState =
  | { screen: 'list' }
  | { screen: 'detail'; clientId: string }
  | { screen: 'edit'; clientId: string }
  | { screen: 'editContract'; clientId: string }
  | { screen: 'addResponsible'; clientId: string };
