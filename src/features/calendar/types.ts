export type TripMode = 'outbound' | 'roundTrip' | 'special';
export type TripType = 'outbound' | 'return' | 'roundTrip' | 'special';

export type TripRecord = {
  id: string;
  user_id: string;
  client_id: string;
  route_id: string;
  rate_id: string;
  summary_id: string | null;
  trip_date: string;
  trip_time: string;
  trip_type: TripType;
  final_price: number;
  has_surcharge: boolean;
  surcharge_reason: string | null;
  special_type: string | null;
  notes: string | null;
  created_at: string;
};

export type CreateTripPayload = {
  client_id: string;
  route_id: string;
  rate_id: string;
  trip_date: string;
  trip_time: string;
  trip_type: 'ida' | 'ida y vuelta' | 'especial';
  special_type?: string | null;
  notes?: string | null;
};

export type CreateCalendarTripInput = {
  dateKey: string;
  mode: TripMode;
  specialType?: string;
  note?: string;
};

export type Trip = {
  id: string;
  recordIds: string[];
  date: string;
  time: string;
  mode: TripMode;
  specialType?: string;
  note?: string;
};

export type TripUpdates = Partial<Pick<Trip, 'time' | 'mode' | 'note' | 'specialType'>>;

export type CalendarDay = {
  date: Date;
  dateKey: string;
  dayNumber: number;
  isToday: boolean;
};

export type PendingSpecialTrip = {
  dateKey: string;
  specialType: string;
  note: string;
};
