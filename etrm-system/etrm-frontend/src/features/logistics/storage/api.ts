import { apiClient } from '@services/api';
import type { StorageFacility, StorageFacilityInput } from './types';

export const storageApi = {
  list: () => apiClient.get<StorageFacility[]>('/storage').then((r) => r.data),
  create: (input: StorageFacilityInput) => apiClient.post<StorageFacility>('/storage', input).then((r) => r.data),
  update: (id: number, input: StorageFacilityInput) => apiClient.put<StorageFacility>(`/storage/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/storage/${id}/deactivate`),
};
