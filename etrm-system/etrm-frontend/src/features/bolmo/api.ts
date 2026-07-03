import { apiClient } from '@services/api';
import type { BolmoAgreement, BolmoAgreementInput, BolmoLeg, BolmoLegInput } from './types';

export const bolmoApi = {
  list:     () => apiClient.get<BolmoAgreement[]>('/bolmo-agreements').then((r) => r.data),
  create:   (input: BolmoAgreementInput) => apiClient.post<BolmoAgreement>('/bolmo-agreements', input).then((r) => r.data),
  update:   (id: number, input: BolmoAgreementInput) => apiClient.put<BolmoAgreement>(`/bolmo-agreements/${id}`, input).then((r) => r.data),
  agree:    (id: number) => apiClient.patch<BolmoAgreement>(`/bolmo-agreements/${id}/agree`).then((r) => r.data),
  complete: (id: number) => apiClient.patch<BolmoAgreement>(`/bolmo-agreements/${id}/complete`).then((r) => r.data),
  dispute:  (id: number) => apiClient.patch<BolmoAgreement>(`/bolmo-agreements/${id}/dispute`).then((r) => r.data),
  cancel:   (id: number) => apiClient.patch<BolmoAgreement>(`/bolmo-agreements/${id}/cancel`).then((r) => r.data),
};

export const bolmoLegsApi = {
  list:   (bolmoId: number) => apiClient.get<BolmoLeg[]>(`/bolmo-agreements/${bolmoId}/legs`).then((r) => r.data),
  create: (bolmoId: number, input: BolmoLegInput) => apiClient.post<BolmoLeg>(`/bolmo-agreements/${bolmoId}/legs`, input).then((r) => r.data),
  delete: (legId: number) => apiClient.delete(`/bolmo-legs/${legId}`),
};
