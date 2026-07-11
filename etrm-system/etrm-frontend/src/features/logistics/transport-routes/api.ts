import { apiClient } from '@services/api';
import type { TransportRoute, TransportRouteInput } from './types';

export const transportRoutesApi = {
  list: () => apiClient.get<TransportRoute[]>('/freight/routes').then((r) => r.data),
  create: (input: TransportRouteInput) => apiClient.post<TransportRoute>('/freight/routes', input).then((r) => r.data),
  update: (id: number, input: TransportRouteInput) => apiClient.put<TransportRoute>(`/freight/routes/${id}`, input).then((r) => r.data),
};
