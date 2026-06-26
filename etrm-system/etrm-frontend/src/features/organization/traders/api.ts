import { apiClient } from '@services/api';
import type { Trader, TraderInput } from './types';

export const tradersApi = {
  list: () => apiClient.get<Trader[]>('/traders').then((r) => r.data),
  get: (id: number) => apiClient.get<Trader>(`/traders/${id}`).then((r) => r.data),
  create: (input: TraderInput) => apiClient.post<Trader>('/traders', input).then((r) => r.data),
  update: (id: number, input: TraderInput) => apiClient.put<Trader>(`/traders/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/traders/${id}/deactivate`),
};
