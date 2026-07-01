// src/services/rates.ts

import { api } from './backendApi';
import type { Rate } from './types';

export const ratesService = {
  /** GET /rates */
  getAll(): Promise<Rate[]> {
    return api.get<Rate[]>('/rates');
  },

  /** GET /rates/route/:routeId */
  getByRoute(routeId: string): Promise<Rate[]> {
    return api.get<Rate[]>(`/rates/route/${routeId}`);
  },
};
