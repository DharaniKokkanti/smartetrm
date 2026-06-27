import { apiClient } from '@services/api';
import type { Pipeline, PipelineInput } from './types';

export const pipelinesApi = {
  list: () => apiClient.get<Pipeline[]>('/pipelines').then((r) => r.data),
  create: (input: PipelineInput) => apiClient.post<Pipeline>('/pipelines', input).then((r) => r.data),
  update: (id: number, input: PipelineInput) => apiClient.put<Pipeline>(`/pipelines/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/pipelines/${id}/deactivate`),
};
