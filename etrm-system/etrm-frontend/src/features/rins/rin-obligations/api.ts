import { apiClient } from '@services/api';
import type { RinObligation, RinObligationInput } from './types';

export const rinObligationApi = {
  list: () => apiClient.get<RinObligation[]>('/rin-obligations').then((r) => r.data),
  create: (input: RinObligationInput) =>
    apiClient.post<RinObligation>('/rin-obligations', input).then((r) => r.data),
  update: (id: number, input: RinObligationInput) =>
    apiClient.put<RinObligation>(`/rin-obligations/${id}`, input).then((r) => r.data),
};
