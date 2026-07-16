import { apiClient } from '@services/api';
import type { CharterOffHireEvent, CharterOffHireEventInput, CharterParty, CharterPartyInput } from './types';

export const charterPartiesApi = {
  list: (params?: { vesselId?: number; counterpartyId?: number }) =>
    apiClient.get<CharterParty[]>('/voyage-ops/charter-parties', { params }).then((r) => r.data),
  get: (id: number) => apiClient.get<CharterParty>(`/voyage-ops/charter-parties/${id}`).then((r) => r.data),
  create: (input: CharterPartyInput) => apiClient.post<CharterParty>('/voyage-ops/charter-parties', input).then((r) => r.data),
  update: (id: number, input: CharterPartyInput) => apiClient.put<CharterParty>(`/voyage-ops/charter-parties/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/voyage-ops/charter-parties/${id}/deactivate`),
};

export const charterOffHireEventsApi = {
  list: (charterPartyId?: number) =>
    apiClient.get<CharterOffHireEvent[]>('/voyage-ops/off-hire-events', { params: { charterPartyId } }).then((r) => r.data),
  create: (input: CharterOffHireEventInput) =>
    apiClient.post<CharterOffHireEvent>('/voyage-ops/off-hire-events', input).then((r) => r.data),
  update: (id: number, input: CharterOffHireEventInput) =>
    apiClient.put<CharterOffHireEvent>(`/voyage-ops/off-hire-events/${id}`, input).then((r) => r.data),
};
