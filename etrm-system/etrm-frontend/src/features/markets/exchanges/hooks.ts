import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { exchangesApi } from './api';
import type { ExchangeInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['exchanges'] as const;

export function useExchanges() {
  return useQuery({ queryKey: KEY, queryFn: exchangesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveExchange() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: ExchangeInput }) =>
      id === null ? exchangesApi.create(input) : exchangesApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Exchange "${d.exchangeCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateExchange() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: exchangesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Exchange deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
