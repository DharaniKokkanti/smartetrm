import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { pipelineSegmentsApi } from './api';
import type { PipelineSegmentInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['pipeline-segments'] as const;

export function usePipelineSegments() {
  return useQuery({ queryKey: KEY, queryFn: pipelineSegmentsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePipelineSegment() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PipelineSegmentInput }) =>
      id === null ? pipelineSegmentsApi.create(input) : pipelineSegmentsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pipeline segment saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePipelineSegment() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: pipelineSegmentsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pipeline segment deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
