import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { tradersApi } from './api';
import type { TraderInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['traders'] as const;

export function useTraders() {
  return useQuery({ queryKey: KEY, queryFn: tradersApi.list });
}

export function useSaveTrader() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TraderInput }) =>
      id === null ? tradersApi.create(input) : tradersApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Trader "${d.traderCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateTrader() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: tradersApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Trader deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
