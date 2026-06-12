// src/services/index.ts
// Un solo import para usar cualquier servicio:
//   import { clientsService, tripsService, summariesService } from '@/services';

export { clientsService } from './clients';
export { tripsService } from './trips';
export { summariesService } from './summaries';
export { ratesService } from './rates';
export { itinerariesService } from './itineraries';
export { defaultsService } from './defaults';
export { ApiError, api, getBackendApiBaseUrl } from './backendApi';
export type * from './types';
