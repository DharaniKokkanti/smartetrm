import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { marketsApi } from './api';
import type { MarketInput, MarketProductLinkInput } from './types';
import type { ProblemDetail } from '@services/api';

const MKT_KEY = ['markets'] as const;

export function useMarkets() {
  return useQuery({ queryKey: MKT_KEY, queryFn: marketsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveMarket() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarketInput }) =>
      id === null ? marketsApi.create(input) : marketsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: MKT_KEY }); message.success(`Market "${d.marketCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateMarket() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: marketsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: MKT_KEY }); message.success('Market deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

export function useMarketProductLinks(marketId: number | null) {
  return useQuery({
    queryKey: [...MKT_KEY, marketId, 'product-links'],
    queryFn: () => marketsApi.listProductLinks(marketId!),
    enabled: marketId != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveMarketProductLink(marketId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarketProductLinkInput }) =>
      id === null ? marketsApi.addProductLink(marketId, input) : marketsApi.updateProductLink(marketId, id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [...MKT_KEY, marketId, 'product-links'] }); message.success('Market product link saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useMarketProductPeriods(marketProductLinkId: number | null) {
  return useQuery({
    queryKey: ['market-product-periods', marketProductLinkId],
    queryFn: () => marketsApi.listPeriods(marketProductLinkId!),
    enabled: marketProductLinkId != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddPeriodToMarketProductLink(marketProductLinkId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (periodId: number) => marketsApi.addPeriod(marketProductLinkId, periodId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['market-product-periods', marketProductLinkId] }); message.success('Period linked.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Failed to link period.'),
  });
}

export function useMarketProductSources(marketProductLinkId: number | null) {
  return useQuery({
    queryKey: ['market-product-sources', marketProductLinkId],
    queryFn: () => marketsApi.listSources(marketProductLinkId!),
    enabled: marketProductLinkId != null,
    staleTime: 5 * 60 * 1000,
  });
}
