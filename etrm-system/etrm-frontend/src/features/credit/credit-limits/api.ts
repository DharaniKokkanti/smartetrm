import { apiClient } from '@services/api';
import type { CreditLimit, CreditLimitInput } from './types';

export const creditLimitsApi = {
  list: () => apiClient.get<CreditLimit[]>('/credit/limits').then((r) => r.data),
  create: (input: CreditLimitInput) => apiClient.post<CreditLimit>('/credit/limits', input).then((r) => r.data),
  update: (id: number, input: CreditLimitInput) => apiClient.put<CreditLimit>(`/credit/limits/${id}`, input).then((r) => r.data),
  suspend: (id: number) => apiClient.patch(`/credit/limits/${id}/suspend`),
  reinstate: (id: number) => apiClient.patch(`/credit/limits/${id}/reinstate`),
};
