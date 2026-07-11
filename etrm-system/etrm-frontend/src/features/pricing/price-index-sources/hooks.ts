import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { priceIndexSourcesApi } from './api';
import type { PriceIndexSourceInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['price-index-sources'] as const;

export function usePriceIndexSources() {
  return useQuery({ queryKey: KEY, queryFn: priceIndexSourcesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePriceIndexSource() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PriceIndexSourceInput }) =>
      id === null ? priceIndexSourcesApi.create(input) : priceIndexSourcesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Price index source saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePriceIndexSource() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: priceIndexSourcesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Price index source deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
