import type { Recorrido } from '../types';

export const mockRecorridos: Recorrido[] = [
  {
    id: 'ruta-1',
    name: 'Casa → Escuela',
    clientName: 'Andrea Gómez',
    clientId: 'client-1',
    stopCount: 4,
    days: ['L', 'M', 'V'],
    stops: [
      { id: 'stop-1', address: 'Av. Rivadavia 4521, CABA', order: 1, type: 'origin' },
      { id: 'stop-2', address: 'Av. Acoyte 234, CABA', order: 2, type: 'stop' },
      { id: 'stop-3', address: 'Yerbal 1102, CABA', order: 3, type: 'stop' },
      { id: 'stop-4', address: 'Beauchef 1270, CABA', order: 4, type: 'destination' },
    ],
    rates: [
      { type: 'ida', price: '$3.500' },
      { type: 'ida y vuelta', price: '$6.000' },
      { type: 'especial', price: null },
    ],
    createdAt: '2026-01-15',
  },
  {
    id: 'ruta-2',
    name: 'Casa → Trabajo',
    clientName: 'Andrea Gómez',
    clientId: 'client-1',
    stopCount: 2,
    days: ['L', 'V'],
    stops: [
      { id: 'stop-5', address: 'Av. Rivadavia 4521, CABA', order: 1, type: 'origin' },
      { id: 'stop-6', address: 'Av. Corrientes 1847, CABA', order: 2, type: 'destination' },
    ],
    rates: [
      { type: 'ida', price: '$4.200' },
      { type: 'ida y vuelta', price: '$7.500' },
      { type: 'especial', price: '$9.000' },
    ],
    createdAt: '2026-02-03',
  },
  {
    id: 'ruta-3',
    name: 'Casa → Depto mamá',
    clientName: 'Andrea Gómez',
    clientId: 'client-1',
    stopCount: 2,
    days: ['M'],
    stops: [
      { id: 'stop-7', address: 'Av. Rivadavia 4521, CABA', order: 1, type: 'origin' },
      { id: 'stop-8', address: 'Av. Scalabrini Ortiz 2840, CABA', order: 2, type: 'destination' },
    ],
    rates: [
      { type: 'ida', price: '$2.800' },
      { type: 'ida y vuelta', price: null },
      { type: 'especial', price: null },
    ],
    createdAt: '2026-02-10',
  },
];

export function getMockRecorridosByClient(clientId: string): Recorrido[] {
  return mockRecorridos.filter((r) => r.clientId === clientId);
}

export function getMockRecorridoById(id: string): Recorrido | undefined {
  return mockRecorridos.find((r) => r.id === id);
}
