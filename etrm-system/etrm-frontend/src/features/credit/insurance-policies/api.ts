import { apiClient } from '@services/api';
import type { InsurancePolicy, InsurancePolicyInput } from './types';

export const insurancePoliciesApi = {
  list: () => apiClient.get<InsurancePolicy[]>('/credit/insurance-policies').then((r) => r.data),
  create: (input: InsurancePolicyInput) => apiClient.post<InsurancePolicy>('/credit/insurance-policies', input).then((r) => r.data),
  update: (id: number, input: InsurancePolicyInput) => apiClient.put<InsurancePolicy>(`/credit/insurance-policies/${id}`, input).then((r) => r.data),
};
