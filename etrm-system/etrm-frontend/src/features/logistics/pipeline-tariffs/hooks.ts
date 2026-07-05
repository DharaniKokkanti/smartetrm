import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { pipelineTariffsApi } from './api';
import type { PipelineTariffInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['pipeline-tariffs'] as const;

export function usePipelineTariffs() {
  return useQuery({ queryKey: KEY, queryFn: pipelineTariffsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePipelineTariff() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PipelineTariffInput }) =>
      id === null ? pipelineTariffsApi.create(input) : pipelineTariffsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pipeline tariff saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePipelineTariff() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: pipelineTariffsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pipeline tariff deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
