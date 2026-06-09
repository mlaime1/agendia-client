import { api } from './backendApi';
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
    if (cachedDefaults) {
      return cachedDefaults;
    }

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

      const preferredClient = clients[0];
      const clientDetail = await clientsService.getById(preferredClient.id);
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
