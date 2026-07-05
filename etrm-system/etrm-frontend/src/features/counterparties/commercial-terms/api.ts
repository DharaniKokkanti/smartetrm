import { apiClient } from '@services/api';
import type { CpCommercialTerms, CpCommercialTermsInput } from './types';

export const cpCommercialTermsApi = {
  list: () => apiClient.get<CpCommercialTerms[]>('/counterparties/commercial-terms').then((r) => r.data),
  create: (input: CpCommercialTermsInput) => apiClient.post<CpCommercialTerms>('/counterparties/commercial-terms', input).then((r) => r.data),
  update: (id: number, input: CpCommercialTermsInput) => apiClient.put<CpCommercialTerms>(`/counterparties/commercial-terms/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/counterparties/commercial-terms/${id}/deactivate`),
};
