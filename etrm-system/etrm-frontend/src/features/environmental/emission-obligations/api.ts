import { apiClient } from '@services/api';
import type { EmissionObligation, EmissionObligationInput } from './types';
export const emissionObligationApi = {
  list: () => apiClient.get<EmissionObligation[]>('/emission-obligations').then((r) => r.data),
  create: (input: EmissionObligationInput) => apiClient.post<EmissionObligation>('/emission-obligations', input).then((r) => r.data),
  update: (id: number, input: EmissionObligationInput) => apiClient.put<EmissionObligation>(`/emission-obligations/${id}`, input).then((r) => r.data),
};
