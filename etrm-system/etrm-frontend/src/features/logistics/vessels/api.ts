import { apiClient } from '@services/api';
import type { Vessel, VesselInput } from './types';

export const vesselsApi = {
  list: () => apiClient.get<Vessel[]>('/vessels').then((r) => r.data),
  create: (input: VesselInput) => apiClient.post<Vessel>('/vessels', input).then((r) => r.data),
  update: (id: number, input: VesselInput) => apiClient.put<Vessel>(`/vessels/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/vessels/${id}/deactivate`),
};
