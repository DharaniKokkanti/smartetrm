import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { priceIndicesApi } from './api';
import type { PriceIndexInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['price-indices'] as const;

export function usePriceIndices() {
  return useQuery({ queryKey: KEY, queryFn: priceIndicesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePriceIndex() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PriceIndexInput }) =>
      id === null ? priceIndicesApi.create(input) : priceIndicesApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Price index "${d.indexCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePriceIndex() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: priceIndicesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Price index deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
