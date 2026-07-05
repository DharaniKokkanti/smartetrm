import { apiClient } from '@services/api';
import type { RegulatoryObligation, RegulatoryObligationInput } from './types';

export const regulatoryObligationsApi = {
  list: () => apiClient.get<RegulatoryObligation[]>('/compliance/obligations').then((r) => r.data),
  create: (input: RegulatoryObligationInput) => apiClient.post<RegulatoryObligation>('/compliance/obligations', input).then((r) => r.data),
  update: (id: number, input: RegulatoryObligationInput) => apiClient.put<RegulatoryObligation>(`/compliance/obligations/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/compliance/obligations/${id}/deactivate`),
};
