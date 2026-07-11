import { apiClient } from '@services/api';
import type { PriceIndexSource, PriceIndexSourceInput } from './types';

export const priceIndexSourcesApi = {
  list: () => apiClient.get<PriceIndexSource[]>('/price-index-sources').then((r) => r.data),
  create: (input: PriceIndexSourceInput) => apiClient.post<PriceIndexSource>('/price-index-sources', input).then((r) => r.data),
  update: (id: number, input: PriceIndexSourceInput) => apiClient.put<PriceIndexSource>(`/price-index-sources/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/price-index-sources/${id}/deactivate`),
};
