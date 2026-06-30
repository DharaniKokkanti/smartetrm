import { apiClient } from '@services/api';
import type { MarginAgreement, MarginAgreementInput } from './types';

export const marginAgreementsApi = {
  list: () => apiClient.get<MarginAgreement[]>('/credit/margin-agreements').then((r) => r.data),
  create: (input: MarginAgreementInput) => apiClient.post<MarginAgreement>('/credit/margin-agreements', input).then((r) => r.data),
  update: (id: number, input: MarginAgreementInput) => apiClient.put<MarginAgreement>(`/credit/margin-agreements/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/credit/margin-agreements/${id}/deactivate`),
};
