import { apiClient } from '@services/api';
import type { Nomination, NominationInput, TradeOrderOption } from './types';

export const nominationsApi = {
  list: () => apiClient.get<Nomination[]>('/operations/nominations').then((r) => r.data),
  create: (input: NominationInput) => apiClient.post<Nomination>('/operations/nominations', input).then((r) => r.data),
  update: (id: number, input: NominationInput) => apiClient.put<Nomination>(`/operations/nominations/${id}`, input).then((r) => r.data),
  orderOptions: () => apiClient.get<TradeOrderOption[]>('/operations/trade-order-options').then((r) => r.data),
};
