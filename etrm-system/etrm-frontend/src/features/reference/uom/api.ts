import { apiClient } from '@services/api';
import type { Uom, UomInput } from './types';
export const uomApi = {
  list: () => apiClient.get<Uom[]>('/uom').then((r) => r.data),
  create: (input: UomInput) => apiClient.post<Uom>('/uom', input).then((r) => r.data),
  update: (id: number, input: Partial<UomInput>) => apiClient.put<Uom>(`/uom/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/uom/${id}/deactivate`, {}),
};
