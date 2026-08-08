import { apiClient } from '@services/api';
import type { ClearingAccount, ClearingAccountInput } from './types';

export const clearingAccountsApi = {
  list: () => apiClient.get<ClearingAccount[]>('/credit/clearing-accounts').then((r) => r.data),
  create: (input: ClearingAccountInput) => apiClient.post<ClearingAccount>('/credit/clearing-accounts', input).then((r) => r.data),
  update: (id: number, input: ClearingAccountInput) => apiClient.put<ClearingAccount>(`/credit/clearing-accounts/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/credit/clearing-accounts/${id}/deactivate`),
};
