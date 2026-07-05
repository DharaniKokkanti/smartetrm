import { apiClient } from '@services/api';
import type { MarginAccount, MarginAccountInput } from './types';

export const marginAccountsApi = {
  list: () => apiClient.get<MarginAccount[]>('/credit/margin-accounts').then((r) => r.data),
  create: (input: MarginAccountInput) => apiClient.post<MarginAccount>('/credit/margin-accounts', input).then((r) => r.data),
  update: (id: number, input: MarginAccountInput) => apiClient.put<MarginAccount>(`/credit/margin-accounts/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/credit/margin-accounts/${id}/deactivate`),
};
