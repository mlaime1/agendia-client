import { TripRecord } from '../types';
import { toDateKey } from '../utils/date';

const dayKey = (day: number) => {
  const now = new Date();

  return toDateKey(new Date(now.getFullYear(), now.getMonth(), day));
};

const createMockTrip = (
  id: string,
  day: number,
  trip_time: string,
  trip_type: TripRecord['trip_type'],
  special_type: string | null = null,
): TripRecord => ({
  id,
  user_id: 'mock-user',
  client_id: '1',
  route_id: '1',
  rate_id: '1',
  summary_id: null,
  trip_date: dayKey(day),
  trip_time,
  trip_type,
  final_price: 0,
  has_surcharge: false,
  surcharge_reason: null,
  special_type,
  notes: null,
  created_at: new Date().toISOString(),
});

export const mockTripRecords: TripRecord[] = [
  createMockTrip('mock-1', 3, '08:10', 'outbound'),
  createMockTrip('mock-2-a', 5, '08:25', 'outbound'),
  createMockTrip('mock-2-b', 5, '08:25', 'return'),
  createMockTrip('mock-3', 8, '07:55', 'outbound'),
  createMockTrip('mock-4', 8, '17:20', 'outbound', 'Parada extra'),
  createMockTrip('mock-5', 12, '07:45', 'outbound'),
  createMockTrip('mock-6-a', 12, '12:30', 'outbound'),
  createMockTrip('mock-6-b', 12, '12:30', 'return'),
  createMockTrip('mock-7', 12, '16:10', 'outbound', 'Desvio'),
  createMockTrip('mock-8', 12, '18:05', 'outbound'),
  createMockTrip('mock-9-a', 18, '09:00', 'outbound'),
  createMockTrip('mock-9-b', 18, '09:00', 'return'),
];
