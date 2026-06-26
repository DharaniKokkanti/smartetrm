import { apiClient } from '@services/api';
import type { Desk, DeskInput } from './types';

export const desksApi = {
  list: () => apiClient.get<Desk[]>('/desks').then((r) => r.data),
  get: (id: number) => apiClient.get<Desk>(`/desks/${id}`).then((r) => r.data),
  create: (input: DeskInput) => apiClient.post<Desk>('/desks', input).then((r) => r.data),
  update: (id: number, input: DeskInput) => apiClient.put<Desk>(`/desks/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/desks/${id}/deactivate`),
};
