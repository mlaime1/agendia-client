export interface RouteStop {
  id: string;
  address: string;
  order: number;
  type: 'origin' | 'destination' | 'stop';
}

export interface RateConfig {
  type: 'ida' | 'ida y vuelta' | 'especial';
  price: string | null;
}

export interface Recorrido {
  id: string;
  name: string;
  clientName: string;
  clientId: string;
  stopCount: number;
  days: string[]; // 'L', 'M', 'X', 'J', 'V', 'S', 'D'
  stops: RouteStop[];
  rates: RateConfig[];
  createdAt: string;
}

export type RecorridoListScreenProps = {
  onMenuPress: () => void;
  selectedClientId: string;
};

export type RecorridoDetailScreenProps = {
  recorridoId: string;
  onBack: () => void;
};
