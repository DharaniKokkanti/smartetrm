import { apiClient } from '@services/api';
import type { CommodityInstrumentMap } from './types';

export const commodityInstrumentMapApi = {
  get: () => apiClient.get<CommodityInstrumentMap>('/commodity-instrument-map').then((r) => r.data),
};
