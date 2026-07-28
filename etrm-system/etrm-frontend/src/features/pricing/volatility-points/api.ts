import { apiClient } from '@services/api';
import type { VolatilityPoint, VolatilityPointInput } from './types';

export const volatilityPointsApi = {
  list: () => apiClient.get<VolatilityPoint[]>('/volatility-points').then((r) => r.data),
  create: (input: VolatilityPointInput) => apiClient.post<VolatilityPoint>('/volatility-points', input).then((r) => r.data),
  update: (id: number, input: VolatilityPointInput) => apiClient.put<VolatilityPoint>(`/volatility-points/${id}`, input).then((r) => r.data),
  confirm: (id: number) => apiClient.patch<VolatilityPoint>(`/volatility-points/${id}/confirm`).then((r) => r.data),
};
