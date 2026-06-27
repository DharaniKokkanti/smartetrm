import { apiClient } from '@services/api';
import type { PriceIndex, PriceIndexInput } from './types';

export const priceIndicesApi = {
  list: () => apiClient.get<PriceIndex[]>('/price-indices').then((r) => r.data),
  create: (input: PriceIndexInput) => apiClient.post<PriceIndex>('/price-indices', input).then((r) => r.data),
  update: (id: number, input: PriceIndexInput) => apiClient.put<PriceIndex>(`/price-indices/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/price-indices/${id}/deactivate`),
};
