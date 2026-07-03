import { apiClient } from '@services/api';
import type { RinFuelCategory, RinFuelCategoryInput } from './types';

export const rinFuelCategoryApi = {
  list: () => apiClient.get<RinFuelCategory[]>('/rin-fuel-categories').then((r) => r.data),
  create: (input: RinFuelCategoryInput) =>
    apiClient.post<RinFuelCategory>('/rin-fuel-categories', input).then((r) => r.data),
  update: (id: number, input: RinFuelCategoryInput) =>
    apiClient.put<RinFuelCategory>(`/rin-fuel-categories/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/rin-fuel-categories/${id}/deactivate`, {}),
};
