import { apiClient } from '@services/api';
import type { ClearingAccountMarginRate, ClearingAccountMarginRateInput } from './types';

export const clearingAccountMarginRatesApi = {
  list: (clearingAccountId: number) =>
    apiClient
      .get<ClearingAccountMarginRate[]>('/credit/clearing-account-margin-rates', { params: { clearingAccountId } })
      .then((r) => r.data),
  create: (input: ClearingAccountMarginRateInput) =>
    apiClient.post<ClearingAccountMarginRate>('/credit/clearing-account-margin-rates', input).then((r) => r.data),
  update: (id: number, input: ClearingAccountMarginRateInput) =>
    apiClient.put<ClearingAccountMarginRate>(`/credit/clearing-account-margin-rates/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/credit/clearing-account-margin-rates/${id}/deactivate`),
};
