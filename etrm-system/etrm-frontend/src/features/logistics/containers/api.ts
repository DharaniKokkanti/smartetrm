import { apiClient } from '@services/api';
import type { Container, ContainerInput } from './types';

export const containersApi = {
  list: () => apiClient.get<Container[]>('/logistics/containers').then((r) => r.data),
  create: (input: ContainerInput) => apiClient.post<Container>('/logistics/containers', input).then((r) => r.data),
  update: (id: number, input: ContainerInput) => apiClient.put<Container>(`/logistics/containers/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/containers/${id}/deactivate`),
};
