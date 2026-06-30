import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchTrades, createTrade, updateTrade, cancelTrade, confirmTrade,
  fetchCounterparties, fetchLegalEntities, fetchIncoterms, fetchBrokers, fetchPipelines,
  fetchTradeOrders, createTradeOrder, updateTradeOrder, cancelTradeOrder, confirmTradeOrder,
  fetchTradeItems, createTradeItem, updateTradeItem, deleteTradeItem,
} from './api';
import type { TradeInput, TradeFilter, TradeOrderInput, TradeItemInput } from './types';

const STALE = 5 * 60 * 1000;

// ─── Trades ───────────────────────────────────────────────────────────────────

export function useTrades(filter: TradeFilter = {}) {
  return useQuery({
    queryKey: ['trades', filter],
    queryFn: () => fetchTrades(filter),
    staleTime: STALE,
  });
}

export function useCounterparties() {
  return useQuery({ queryKey: ['counterparties'], queryFn: fetchCounterparties, staleTime: STALE });
}
export function useLegalEntities() {
  return useQuery({ queryKey: ['legal-entities'], queryFn: fetchLegalEntities, staleTime: STALE });
}
export function useIncoterms() {
  return useQuery({ queryKey: ['incoterms'], queryFn: fetchIncoterms, staleTime: STALE });
}
export function useBrokers() {
  return useQuery({ queryKey: ['brokers'], queryFn: fetchBrokers, staleTime: STALE });
}
export function usePipelines() {
  return useQuery({ queryKey: ['pipelines'], queryFn: fetchPipelines, staleTime: STALE });
}

export function useSaveTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeInput }) =>
      id ? updateTrade(id, input) : createTrade(input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['trades'] }); },
  });
}

export function useCancelTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelTrade(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['trades'] }); },
  });
}

export function useConfirmTrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => confirmTrade(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['trades'] }); },
  });
}

// ─── Trade Orders ─────────────────────────────────────────────────────────────

export function useTradeOrders(tradeId: number | null) {
  return useQuery({
    queryKey: ['trade-orders', tradeId],
    queryFn: () => fetchTradeOrders(tradeId!),
    enabled: tradeId !== null,
    staleTime: STALE,
  });
}

export function useSaveTradeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeOrderInput }) =>
      id ? updateTradeOrder(id, input) : createTradeOrder(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-orders', vars.input.tradeId] });
      void qc.invalidateQueries({ queryKey: ['trades'] });
    },
  });
}

export function useCancelTradeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      cancelTradeOrder(id).then((r) => ({ r, tradeId })),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['trade-orders', res.tradeId] });
    },
  });
}

export function useConfirmTradeOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      confirmTradeOrder(id).then((r) => ({ r, tradeId })),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['trade-orders', res.tradeId] });
    },
  });
}

// ─── Trade Items ──────────────────────────────────────────────────────────────

export function useTradeItems(orderId: number | null) {
  return useQuery({
    queryKey: ['trade-items', orderId],
    queryFn: () => fetchTradeItems(orderId!),
    enabled: orderId !== null,
    staleTime: STALE,
  });
}

export function useSaveTradeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeItemInput }) =>
      id ? updateTradeItem(id, input) : createTradeItem(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-items', vars.input.orderId] });
    },
  });
}

export function useDeleteTradeItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, orderId }: { id: number; orderId: number }) =>
      deleteTradeItem(id).then(() => orderId),
    onSuccess: (orderId) => {
      void qc.invalidateQueries({ queryKey: ['trade-items', orderId] });
    },
  });
}
