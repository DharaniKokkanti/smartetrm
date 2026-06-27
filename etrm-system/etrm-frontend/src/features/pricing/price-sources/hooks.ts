import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { priceSourcesApi } from './api';
import type { PriceSourceInput, PriceIndexSourceInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['price-sources'] as const;
const PIS_KEY = ['price-index-sources'] as const;

export function usePriceSources() {
  return useQuery({ queryKey: KEY, queryFn: priceSourcesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePriceSource() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PriceSourceInput }) =>
      id === null ? priceSourcesApi.create(input) : priceSourcesApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Price source "${d.sourceCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePriceSource() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: priceSourcesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Price source deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

export function usePriceIndexSources(priceSourceId: number | null) {
  return useQuery({
    queryKey: [...KEY, priceSourceId, 'index-links'],
    queryFn: () => priceSourcesApi.listIndexLinks(priceSourceId!),
    enabled: priceSourceId != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllPriceIndexSources() {
  return useQuery({ queryKey: PIS_KEY, queryFn: priceSourcesApi.listAllIndexSources, staleTime: 5 * 60 * 1000 });
}

export function useSavePriceIndexSource() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PriceIndexSourceInput }) =>
      id === null ? priceSourcesApi.addIndexLink(input) : priceSourcesApi.updateIndexLink(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: PIS_KEY }); qc.invalidateQueries({ queryKey: KEY }); message.success('Index-source link saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useRemovePriceIndexSource() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: priceSourcesApi.removeIndexLink,
    onSuccess: () => { qc.invalidateQueries({ queryKey: PIS_KEY }); qc.invalidateQueries({ queryKey: KEY }); message.success('Link removed.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Remove failed.'),
  });
}
