import { apiClient } from '@services/api';
import type { Period, PeriodInput } from './types';

export const periodsApi = {
  list: () => apiClient.get<Period[]>('/periods').then((r) => r.data),
  create: (input: PeriodInput) => apiClient.post<Period>('/periods', input).then((r) => r.data),
  update: (id: number, input: PeriodInput) => apiClient.put<Period>(`/periods/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/periods/${id}/deactivate`),
};
