import { apiClient } from '@services/api';
import type { CarbonRegistry, CarbonRegistryInput } from './types';
export const carbonRegistryApi = {
  list: () => apiClient.get<CarbonRegistry[]>('/carbon-registries').then((r) => r.data),
  create: (input: CarbonRegistryInput) => apiClient.post<CarbonRegistry>('/carbon-registries', input).then((r) => r.data),
  update: (id: number, input: CarbonRegistryInput) => apiClient.put<CarbonRegistry>(`/carbon-registries/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/carbon-registries/${id}/deactivate`, {}),
};
