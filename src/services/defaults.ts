// src/services/defaults.ts
// Obtiene IDs por defecto válidos del backend

import { clientsService } from './clients';
import type { Client, Route, Rate } from './types';

export interface Defaults {
  client: Client | null;
  route: Route | null;
  rate: Rate | null;
  clientId: string | null;
  routeId: string | null;
  rateId: string | null;
}

let cachedDefaults: Defaults | null = null;

export const defaultsService = {
  async getDefaults(accessToken?: string): Promise<Defaults> {
    // Return cached if available
    if (cachedDefaults) {
      return cachedDefaults;
    }

    try {
      if (!accessToken) {
        return {
          client: null,
          route: null,
          rate: null,
          clientId: null,
          routeId: null,
          rateId: null,
        };
      }

      const clients = await clientsService.getAll(accessToken);

      if (!clients || clients.length === 0) {
        return {
          client: null,
          route: null,
          rate: null,
          clientId: null,
          routeId: null,
          rateId: null,
        };
      }

      const preferredClient = clients[0];

      // Get client details (includes routes)
      const clientDetail = await clientsService.getById(preferredClient.id, accessToken);
      const route = clientDetail.routes?.[0] ?? null;

      if (!route) {
        return {
          client: clientDetail,
          route: null,
          rate: null,
          clientId: preferredClient.id,
          routeId: null,
          rateId: null,
        };
      }

      const rate: Rate | null = null;
      const rateId = null;

      cachedDefaults = {
        client: clientDetail,
        route,
        rate,
        clientId: preferredClient.id,
        routeId: route.id,
        rateId: rateId,
      };

      return cachedDefaults;
    } catch (error) {
      console.error('[defaultsService] Failed to fetch defaults:', error);
      return {
        client: null,
        route: null,
        rate: null,
        clientId: null,
        routeId: null,
        rateId: null,
      };
    }
  },

  clearCache() {
    cachedDefaults = null;
  },
};
