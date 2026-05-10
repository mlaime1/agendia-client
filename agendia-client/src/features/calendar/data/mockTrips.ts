import { Trip } from '../types';
import { toDateKey } from '../utils/date';

const dayKey = (day: number) => {
  const now = new Date();

  return toDateKey(new Date(now.getFullYear(), now.getMonth(), day));
};

export const mockTrips: Trip[] = [
  { id: 'mock-1', date: dayKey(3), mode: 'outbound' },
  { id: 'mock-2', date: dayKey(5), mode: 'roundTrip' },
  { id: 'mock-3', date: dayKey(8), mode: 'outbound' },
  { id: 'mock-4', date: dayKey(8), mode: 'special', specialType: 'Extra stop' },
  { id: 'mock-5', date: dayKey(12), mode: 'outbound' },
  { id: 'mock-6', date: dayKey(12), mode: 'roundTrip' },
  { id: 'mock-7', date: dayKey(12), mode: 'special', specialType: 'Detour' },
  { id: 'mock-8', date: dayKey(12), mode: 'outbound' },
  { id: 'mock-9', date: dayKey(18), mode: 'roundTrip' },
];
