import { apiClient } from '@services/api';
import type { Location, LocationInput } from './types';

export const locationsApi = {
  list: () => apiClient.get<Location[]>('/locations').then((r) => r.data),
  create: (input: LocationInput) => apiClient.post<Location>('/locations', input).then((r) => r.data),
  update: (id: number, input: LocationInput) => apiClient.put<Location>(`/locations/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/locations/${id}/deactivate`),
  listTradingDesks: () => apiClient.get<Location[]>('/locations/trading-desks').then((r) => r.data),
};
