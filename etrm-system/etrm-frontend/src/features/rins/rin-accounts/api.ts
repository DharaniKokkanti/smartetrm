import { apiClient } from '@services/api';
import type { RinAccount, RinAccountInput } from './types';

export const rinAccountApi = {
  list: () => apiClient.get<RinAccount[]>('/rin-accounts').then((r) => r.data),
  create: (input: RinAccountInput) =>
    apiClient.post<RinAccount>('/rin-accounts', input).then((r) => r.data),
  update: (id: number, input: RinAccountInput) =>
    apiClient.put<RinAccount>(`/rin-accounts/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/rin-accounts/${id}/deactivate`, {}),
};
