import { apiClient } from '@services/api';
import type { PipelineSegment, PipelineSegmentInput } from './types';

export const pipelineSegmentsApi = {
  list: () => apiClient.get<PipelineSegment[]>('/logistics/pipeline-segments').then((r) => r.data),
  create: (input: PipelineSegmentInput) => apiClient.post<PipelineSegment>('/logistics/pipeline-segments', input).then((r) => r.data),
  update: (id: number, input: PipelineSegmentInput) => apiClient.put<PipelineSegment>(`/logistics/pipeline-segments/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/pipeline-segments/${id}/deactivate`),
};
