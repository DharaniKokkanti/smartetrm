import { apiClient } from '@services/api';
import type { ContractMarginRate, ContractMarginRateInput } from './types';

export const contractMarginRatesApi = {
  list: (contractSpecId: number) =>
    apiClient
      .get<ContractMarginRate[]>('/credit/contract-margin-rates', { params: { contractSpecId } })
      .then((r) => r.data),
  create: (input: ContractMarginRateInput) =>
    apiClient.post<ContractMarginRate>('/credit/contract-margin-rates', input).then((r) => r.data),
  update: (id: number, input: ContractMarginRateInput) =>
    apiClient.put<ContractMarginRate>(`/credit/contract-margin-rates/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/credit/contract-margin-rates/${id}/deactivate`),
};
