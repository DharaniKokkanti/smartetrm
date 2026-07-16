import { apiClient } from '@services/api';
import type { Voyage, VoyageInput } from './types';

export const voyagesApi = {
  list: (params?: { vesselId?: number; charterPartyId?: number }) =>
    apiClient.get<Voyage[]>('/voyage-ops/voyages', { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<Voyage>(`/voyage-ops/voyages/${id}`).then((r) => r.data),
  create: (input: VoyageInput) => apiClient.post<Voyage>('/voyage-ops/voyages', input).then((r) => r.data),
  update: (id: number, input: VoyageInput) => apiClient.put<Voyage>(`/voyage-ops/voyages/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/voyage-ops/voyages/${id}/deactivate`),
};
