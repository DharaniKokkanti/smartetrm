import { apiClient } from '@services/api';
import type { Truck, TruckInput } from './types';

export const trucksApi = {
  list: () => apiClient.get<Truck[]>('/trucks').then((r) => r.data),
  create: (input: TruckInput) => apiClient.post<Truck>('/trucks', input).then((r) => r.data),
  update: (id: number, input: TruckInput) => apiClient.put<Truck>(`/trucks/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/trucks/${id}/deactivate`),
};
