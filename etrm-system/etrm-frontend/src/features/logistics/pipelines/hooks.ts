import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { pipelinesApi } from './api';
import type { PipelineInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['pipelines'] as const;

export function usePipelines() {
  return useQuery({ queryKey: KEY, queryFn: pipelinesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePipeline() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PipelineInput }) =>
      id === null ? pipelinesApi.create(input) : pipelinesApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Pipeline "${d.pipelineCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePipeline() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: pipelinesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pipeline deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
