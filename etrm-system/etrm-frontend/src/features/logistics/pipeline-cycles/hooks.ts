import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { pipelineCyclesApi } from './api';
import type { PipelineCycleInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['pipeline-cycles'] as const;

export function usePipelineCycles() {
  return useQuery({ queryKey: KEY, queryFn: pipelineCyclesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePipelineCycle() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PipelineCycleInput }) =>
      id === null ? pipelineCyclesApi.create(input) : pipelineCyclesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pipeline cycle saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePipelineCycle() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: pipelineCyclesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pipeline cycle deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
