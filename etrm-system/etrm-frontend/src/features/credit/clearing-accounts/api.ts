import { apiClient } from '@services/api';
import type { ClearingAccount, ClearingAccountInput } from './types';
import type { BankAccount } from '@features/tier1/counterparty/types';

export const clearingAccountsApi = {
  list: () => apiClient.get<ClearingAccount[]>('/credit/clearing-accounts').then((r) => r.data),
  create: (input: ClearingAccountInput) => apiClient.post<ClearingAccount>('/credit/clearing-accounts', input).then((r) => r.data),
  update: (id: number, input: ClearingAccountInput) => apiClient.put<ClearingAccount>(`/credit/clearing-accounts/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/credit/clearing-accounts/${id}/deactivate`),

  bankAccounts: {
    list: (clearingAccountId: number) =>
      apiClient.get<BankAccount[]>(`/credit/clearing-accounts/${clearingAccountId}/bank-accounts`).then((r) => r.data),
    create: (clearingAccountId: number, b: Omit<BankAccount, 'bankAccountId' | '_localId'>) =>
      apiClient.post<BankAccount>(`/credit/clearing-accounts/${clearingAccountId}/bank-accounts`, b).then((r) => r.data),
    update: (clearingAccountId: number, bankAccountId: number, b: Omit<BankAccount, 'bankAccountId' | '_localId'>) =>
      apiClient.put<BankAccount>(`/credit/clearing-accounts/${clearingAccountId}/bank-accounts/${bankAccountId}`, b).then((r) => r.data),
  },
};
