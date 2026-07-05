import { apiClient } from '@services/api';
import type { NettingAgreement, NettingAgreementInput } from './types';

export const nettingAgreementsApi = {
  list: () => apiClient.get<NettingAgreement[]>('/counterparties/netting-agreements').then((r) => r.data),
  create: (input: NettingAgreementInput) => apiClient.post<NettingAgreement>('/counterparties/netting-agreements', input).then((r) => r.data),
  update: (id: number, input: NettingAgreementInput) => apiClient.put<NettingAgreement>(`/counterparties/netting-agreements/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/counterparties/netting-agreements/${id}/deactivate`),
};
