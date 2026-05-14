// src/services/index.ts
// Un solo import para usar cualquier servicio:
//   import { clientsService, tripsService, summariesService } from '@/services';

export { clientsService } from './clients';
export { tripsService } from './trips';
export { summariesService } from './summaries';
export { ApiError } from './apiClient';
export type * from './types';
