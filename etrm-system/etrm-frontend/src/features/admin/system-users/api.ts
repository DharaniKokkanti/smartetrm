import { apiClient } from '@services/api';
import type { SystemUser, SystemUserInput } from './types';

export const systemUsersApi = {
  list: () => apiClient.get<SystemUser[]>('/admin/users').then((r) => r.data),
  create: (input: SystemUserInput) => apiClient.post<SystemUser>('/admin/users', input).then((r) => r.data),
  update: (id: number, input: SystemUserInput) => apiClient.put<SystemUser>(`/admin/users/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/admin/users/${id}/deactivate`),
};
