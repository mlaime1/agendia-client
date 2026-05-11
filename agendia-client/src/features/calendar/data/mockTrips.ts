import { Trip } from '../types';
import { toDateKey } from '../utils/date';

const dayKey = (day: number) => {
  const now = new Date();

  return toDateKey(new Date(now.getFullYear(), now.getMonth(), day));
};

export const mockTrips: Trip[] = [
  { id: 'mock-1', date: dayKey(3), time: '08:10', mode: 'outbound' },
  { id: 'mock-2', date: dayKey(5), time: '08:25', mode: 'roundTrip' },
  { id: 'mock-3', date: dayKey(8), time: '07:55', mode: 'outbound' },
  { id: 'mock-4', date: dayKey(8), time: '17:20', mode: 'special', specialType: 'Parada extra' },
  { id: 'mock-5', date: dayKey(12), time: '07:45', mode: 'outbound' },
  { id: 'mock-6', date: dayKey(12), time: '12:30', mode: 'roundTrip' },
  { id: 'mock-7', date: dayKey(12), time: '16:10', mode: 'special', specialType: 'Desvío' },
  { id: 'mock-8', date: dayKey(12), time: '18:05', mode: 'outbound' },
  { id: 'mock-9', date: dayKey(18), time: '09:00', mode: 'roundTrip' },
];
