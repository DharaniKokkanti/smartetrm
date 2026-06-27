import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { marketsApi } from './api';
import type { MarketInput, MarketProductInput } from './types';
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

export function useMarketProducts(marketId: number | null) {
  return useQuery({
    queryKey: [...MKT_KEY, marketId, 'products'],
    queryFn: () => marketsApi.listProducts(marketId!),
    enabled: marketId != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveMarketProduct(marketId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarketProductInput }) =>
      id === null ? marketsApi.addProduct(marketId, input) : marketsApi.updateProduct(marketId, id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: [...MKT_KEY, marketId, 'products'] }); message.success('Market product saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useMarketProductPeriods(marketProductId: number | null) {
  return useQuery({
    queryKey: ['market-product-periods', marketProductId],
    queryFn: () => marketsApi.listPeriods(marketProductId!),
    enabled: marketProductId != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAddPeriodToMarketProduct(marketProductId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (periodId: number) => marketsApi.addPeriod(marketProductId, periodId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['market-product-periods', marketProductId] }); message.success('Period linked.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Failed to link period.'),
  });
}

export function useMarketProductSources(marketProductId: number | null) {
  return useQuery({
    queryKey: ['market-product-sources', marketProductId],
    queryFn: () => marketsApi.listSources(marketProductId!),
    enabled: marketProductId != null,
    staleTime: 5 * 60 * 1000,
  });
}
