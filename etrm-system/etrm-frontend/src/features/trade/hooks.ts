import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTrades, createTrade, updateTrade, cancelTrade, confirmTrade, fetchCounterparties, fetchLegalEntities, fetchIncoterms } from './api';
import type { TradeInput, TradeFilter } from './types';

const STALE = 5 * 60 * 1000;

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
