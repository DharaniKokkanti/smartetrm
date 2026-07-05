import { apiClient } from '@services/api';
import type { CpGtcAgreement, CpGtcAgreementInput } from './types';

export const cpGtcAgreementsApi = {
  list: () => apiClient.get<CpGtcAgreement[]>('/counterparties/gtc-agreements').then((r) => r.data),
  create: (input: CpGtcAgreementInput) => apiClient.post<CpGtcAgreement>('/counterparties/gtc-agreements', input).then((r) => r.data),
  update: (id: number, input: CpGtcAgreementInput) => apiClient.put<CpGtcAgreement>(`/counterparties/gtc-agreements/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/counterparties/gtc-agreements/${id}/deactivate`),
};
