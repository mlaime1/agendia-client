import type {
  Itinerary,
  ItineraryStop,
  ItineraryRate,
  ItineraryRateType,
  CreateItineraryDto,
  CreateItineraryStopDto,
  CreateItineraryRateDto,
} from '../../services/types';

export type {
  Itinerary,
  ItineraryStop,
  ItineraryRate,
  ItineraryRateType,
  CreateItineraryDto,
  CreateItineraryStopDto,
  CreateItineraryRateDto,
};

export type RecorridoListScreenProps = {
  onMenuPress: () => void;
  selectedClientId: string;
};

export type RecorridoDetailScreenProps = {
  recorridoId: string;
  onBack: () => void;
};

export type RecorridoListItem = Itinerary & {
  stopCount: number;
  ratesSummary: ItineraryRate[];
};

export type FormStop = {
  id: string;
  name: string;
  address: string;
  type: 'origin' | 'destination' | 'stop';
};

export type FormRate = {
  type: ItineraryRateType;
  price: string;
};
