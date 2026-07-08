import { apiClient } from '@services/api';
import type { PipelineCycle, PipelineCycleInput } from './types';

export const pipelineCyclesApi = {
  list: () => apiClient.get<PipelineCycle[]>('/logistics/pipeline-cycles').then((r) => r.data),
  create: (input: PipelineCycleInput) => apiClient.post<PipelineCycle>('/logistics/pipeline-cycles', input).then((r) => r.data),
  update: (id: number, input: PipelineCycleInput) => apiClient.put<PipelineCycle>(`/logistics/pipeline-cycles/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/pipeline-cycles/${id}/deactivate`),
};
