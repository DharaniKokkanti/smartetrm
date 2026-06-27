import { apiClient } from '@services/api';
import type { Incoterm, IncotermInput } from './types';
export const incotermsApi = {
  list: () => apiClient.get<Incoterm[]>('/incoterms-ref').then((r) => r.data),
  create: (input: IncotermInput) => apiClient.post<Incoterm>('/incoterms-ref', input).then((r) => r.data),
  update: (id: number, input: Partial<IncotermInput>) => apiClient.put<Incoterm>(`/incoterms-ref/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/incoterms-ref/${id}/deactivate`, {}),
};
