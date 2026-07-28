import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { tickerMappingsApi } from './api';
import type { TickerMappingInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['ticker-mappings'] as const;

export function useTickerMappings() {
  return useQuery({ queryKey: KEY, queryFn: tickerMappingsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveTickerMapping() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TickerMappingInput }) =>
      id === null ? tickerMappingsApi.create(input) : tickerMappingsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Ticker mapping saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateTickerMapping() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: tickerMappingsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Ticker mapping deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
