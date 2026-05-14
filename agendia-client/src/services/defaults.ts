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
  async getDefaults(): Promise<Defaults> {
    // Return cached if available
    if (cachedDefaults) {
      return cachedDefaults;
    }

    const fallbackClientId = '3';
    const fallbackRouteId = '3';
    const fallbackRateId = '1';

    try {
      const clients = await clientsService.getAll();

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

      // Prefer the client linked to the known rate row.
      const preferredClient = clients.find((client) => client.id === fallbackClientId) ?? clients[0];

      // Get client details (includes routes)
      const clientDetail = await clientsService.getById(preferredClient.id);
      const route = (clientDetail.routes?.find((item) => item.id === fallbackRouteId) ?? clientDetail.routes?.[0]) || null;

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

      // Rates endpoint is not available yet, so use a known valid rate id.
      const rate: Rate | null = null;
      const rateId = '1';

      cachedDefaults = {
        client: clientDetail,
        route,
        rate,
        clientId: preferredClient.id,
        routeId: route.id,
        rateId: fallbackRateId,
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
