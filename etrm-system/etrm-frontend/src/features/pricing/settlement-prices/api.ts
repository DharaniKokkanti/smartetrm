import { apiClient } from '@services/api';
import type { SettlementPrice, SettlementPriceInput } from './types';

export const settlementPricesApi = {
  list: () => apiClient.get<SettlementPrice[]>('/settlement-prices').then((r) => r.data),
  create: (input: SettlementPriceInput) => apiClient.post<SettlementPrice>('/settlement-prices', input).then((r) => r.data),
  update: (id: number, input: SettlementPriceInput) => apiClient.put<SettlementPrice>(`/settlement-prices/${id}`, input).then((r) => r.data),
  confirm: (id: number) => apiClient.patch<SettlementPrice>(`/settlement-prices/${id}/confirm`).then((r) => r.data),
};
