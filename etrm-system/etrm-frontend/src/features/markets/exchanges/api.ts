import { apiClient } from '@services/api';
import type { Exchange, ExchangeInput } from './types';

export const exchangesApi = {
  list: () => apiClient.get<Exchange[]>('/exchanges').then((r) => r.data),
  create: (input: ExchangeInput) => apiClient.post<Exchange>('/exchanges', input).then((r) => r.data),
  update: (id: number, input: ExchangeInput) => apiClient.put<Exchange>(`/exchanges/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/exchanges/${id}/deactivate`),
};
