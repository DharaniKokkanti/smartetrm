import { apiClient } from '@services/api';
import type { BankGuarantee, BankGuaranteeInput } from './types';

export const bankGuaranteesApi = {
  list: () => apiClient.get<BankGuarantee[]>('/credit/bank-guarantees').then((r) => r.data),
  create: (input: BankGuaranteeInput) => apiClient.post<BankGuarantee>('/credit/bank-guarantees', input).then((r) => r.data),
  update: (id: number, input: BankGuaranteeInput) => apiClient.put<BankGuarantee>(`/credit/bank-guarantees/${id}`, input).then((r) => r.data),
};
