import { apiClient } from '@services/api';
import type { Tank, TankInput } from './types';

export const tanksApi = {
  list: () => apiClient.get<Tank[]>('/logistics/tanks').then((r) => r.data),
  create: (input: TankInput) => apiClient.post<Tank>('/logistics/tanks', input).then((r) => r.data),
  update: (id: number, input: TankInput) => apiClient.put<Tank>(`/logistics/tanks/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/tanks/${id}/deactivate`),
};
