import { apiClient } from '@services/api';
import type { GlAccount, GlAccountInput } from './types';
export const glAccountApi = {
  list: () => apiClient.get<GlAccount[]>('/gl-accounts').then((r) => r.data),
  create: (input: GlAccountInput) => apiClient.post<GlAccount>('/gl-accounts', input).then((r) => r.data),
  update: (id: number, input: GlAccountInput) => apiClient.put<GlAccount>(`/gl-accounts/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/gl-accounts/${id}/deactivate`, {}),
};
