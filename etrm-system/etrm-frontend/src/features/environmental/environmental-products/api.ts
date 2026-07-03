import { apiClient } from '@services/api';
import type { EnvironmentalProduct, EnvironmentalProductInput } from './types';
export const environmentalProductApi = {
  list: () => apiClient.get<EnvironmentalProduct[]>('/environmental-products').then((r) => r.data),
  create: (input: EnvironmentalProductInput) => apiClient.post<EnvironmentalProduct>('/environmental-products', input).then((r) => r.data),
  update: (id: number, input: EnvironmentalProductInput) => apiClient.put<EnvironmentalProduct>(`/environmental-products/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/environmental-products/${id}/deactivate`, {}),
};
