import { apiClient } from '@services/api';
import type { EmissionScheme, EmissionSchemeInput } from './types';
export const emissionSchemeApi = {
  list: () => apiClient.get<EmissionScheme[]>('/emission-schemes').then((r) => r.data),
  create: (input: EmissionSchemeInput) => apiClient.post<EmissionScheme>('/emission-schemes', input).then((r) => r.data),
  update: (id: number, input: EmissionSchemeInput) => apiClient.put<EmissionScheme>(`/emission-schemes/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/emission-schemes/${id}/deactivate`, {}),
};
