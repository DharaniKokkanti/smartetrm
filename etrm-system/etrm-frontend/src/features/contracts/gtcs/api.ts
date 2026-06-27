import { apiClient } from '@services/api';
import type { Gtc, GtcInput } from './types';

export const gtcsApi = {
  list: () => apiClient.get<Gtc[]>('/gtcs').then((r) => r.data),
  create: (input: GtcInput) => apiClient.post<Gtc>('/gtcs', input).then((r) => r.data),
  update: (id: number, input: GtcInput) => apiClient.put<Gtc>(`/gtcs/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/gtcs/${id}/deactivate`),
};
