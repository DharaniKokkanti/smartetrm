import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import {
  fetchTrades, createTrade, updateTrade, cancelTrade, confirmTrade,
  fetchCounterparties, fetchLegalEntities, fetchIncoterms, fetchBrokers, fetchPipelines,
  fetchTradeOrders, createTradeOrder, updateTradeOrder,
  fetchTradeLegs, createTradeLeg, updateTradeLeg, cancelTradeLeg, confirmTradeLeg,
  fetchTradeItems, createTradeItem, updateTradeItem, deleteTradeItem,
  fetchTradeCosts, createTradeCost, updateTradeCost, deleteTradeCost,
  fetchLegCosts, createLegCost, updateLegCost, deleteLegCost,
  fetchAssayResults, createAssayResult, updateAssayResult, deleteAssayResult,
  fetchCustomFieldDefinitions, createCustomFieldDefinition, updateCustomFieldDefinition,
  fetchTradeCustomFieldValues, saveTradeCustomFieldValue, deleteTradeCustomFieldValue,
  fetchLegCustomFieldValues, saveLegCustomFieldValue, deleteLegCustomFieldValue,
} from './api';
import type {
  TradeInput, TradeFilter, TradeOrderInput, TradeLegInput, TradeItemInput,
  TradeCostInput, TradeLegCostInput, TradeAssayResultInput,
  CustomFieldDefinitionInput, TradeCustomFieldValueInput, TradeLegCustomFieldValueInput,
} from './types';
import type { ProblemDetail } from '@services/api';

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
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeInput }) =>
      id ? updateTrade(id, input) : createTrade(input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['trades'] }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useCancelTrade() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => cancelTrade(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['trades'] }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Cancel failed.'),
  });
}

export function useConfirmTrade() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => confirmTrade(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: ['trades'] }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Confirm failed.'),
  });
}

// ─── Orders (the commercial order header — V258) ───────────────────────────────
// Today's UI creates one order 1:1 with each leg it creates (see useSaveTradeLeg
// below) — these hooks let a leg form read/save its paired order's own fields
// (order quantity, order execution date, order type).

export function useTradeOrders(tradeId: number | null) {
  return useQuery({
    queryKey: ['orders', tradeId],
    queryFn: () => fetchTradeOrders(tradeId!),
    enabled: tradeId !== null,
    staleTime: STALE,
  });
}

export function useSaveTradeOrder() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeOrderInput }) =>
      id ? updateTradeOrder(id, input) : createTradeOrder(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['orders', vars.input.tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

// ─── Trade Legs (RENAME of the old "Trade Orders" — V258) ─────────────────────

export function useTradeLegs(tradeId: number | null) {
  return useQuery({
    queryKey: ['trade-legs', tradeId],
    queryFn: () => fetchTradeLegs(tradeId!),
    enabled: tradeId !== null,
    staleTime: STALE,
  });
}

export function useSaveTradeLeg() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeLegInput }) =>
      id ? updateTradeLeg(id, input) : createTradeLeg(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-legs', vars.input.tradeId] });
      void qc.invalidateQueries({ queryKey: ['trades'] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useCancelTradeLeg() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      cancelTradeLeg(id).then((r) => ({ r, tradeId })),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['trade-legs', res.tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Cancel failed.'),
  });
}

export function useConfirmTradeLeg() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      confirmTradeLeg(id).then((r) => ({ r, tradeId })),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['trade-legs', res.tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Confirm failed.'),
  });
}

// ─── Trade Items ──────────────────────────────────────────────────────────────

export function useTradeItems(legId: number | null) {
  return useQuery({
    queryKey: ['trade-items', legId],
    queryFn: () => fetchTradeItems(legId!),
    enabled: legId !== null,
    staleTime: STALE,
  });
}

export function useSaveTradeItem() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeItemInput }) =>
      id ? updateTradeItem(id, input) : createTradeItem(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-items', vars.input.legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteTradeItem() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, legId }: { id: number; legId: number }) =>
      deleteTradeItem(id).then(() => legId),
    onSuccess: (legId) => {
      void qc.invalidateQueries({ queryKey: ['trade-items', legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}

// ─── Trade Costs (trade-level secondary costs, V88) ──────────────────────────

export function useTradeCosts(tradeId: number | null) {
  return useQuery({
    queryKey: ['trade-costs', tradeId],
    queryFn: () => fetchTradeCosts(tradeId!),
    enabled: tradeId !== null,
    staleTime: STALE,
  });
}

export function useSaveTradeCost() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeCostInput }) =>
      id ? updateTradeCost(id, input) : createTradeCost(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-costs', vars.input.tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteTradeCost() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      deleteTradeCost(id).then(() => tradeId),
    onSuccess: (tradeId) => {
      void qc.invalidateQueries({ queryKey: ['trade-costs', tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}

// ─── Leg Costs (leg-level secondary costs, V88; tran_leg_cost since V258) ────

export function useLegCosts(legId: number | null) {
  return useQuery({
    queryKey: ['leg-costs', legId],
    queryFn: () => fetchLegCosts(legId!),
    enabled: legId !== null,
    staleTime: STALE,
  });
}

export function useSaveLegCost() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeLegCostInput }) =>
      id ? updateLegCost(id, input) : createLegCost(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['leg-costs', vars.input.legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteLegCost() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, legId }: { id: number; legId: number }) =>
      deleteLegCost(id).then(() => legId),
    onSuccess: (legId) => {
      void qc.invalidateQueries({ queryKey: ['leg-costs', legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}

// ─── Assay Results (physical-leg quality results, V88) ───────────────────────

export function useAssayResults(legId: number | null) {
  return useQuery({
    queryKey: ['assay-results', legId],
    queryFn: () => fetchAssayResults(legId!),
    enabled: legId !== null,
    staleTime: STALE,
  });
}

export function useSaveAssayResult() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeAssayResultInput }) =>
      id ? updateAssayResult(id, input) : createAssayResult(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['assay-results', vars.input.legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteAssayResult() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, legId }: { id: number; legId: number }) =>
      deleteAssayResult(id).then(() => legId),
    onSuccess: (legId) => {
      void qc.invalidateQueries({ queryKey: ['assay-results', legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}

// ─── Custom field registry (V89) ───────────────────────────────────────────────

export function useCustomFieldDefinitions() {
  return useQuery({
    queryKey: ['custom-field-definitions'],
    queryFn: fetchCustomFieldDefinitions,
    staleTime: STALE,
  });
}

export function useSaveCustomFieldDefinition() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CustomFieldDefinitionInput }) =>
      id ? updateCustomFieldDefinition(id, input) : createCustomFieldDefinition(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['custom-field-definitions'] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useTradeCustomFieldValues(tradeId: number | null) {
  return useQuery({
    queryKey: ['trade-custom-field-values', tradeId],
    queryFn: () => fetchTradeCustomFieldValues(tradeId!),
    enabled: tradeId !== null,
    staleTime: STALE,
  });
}

export function useSaveTradeCustomFieldValue() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: TradeCustomFieldValueInput) => saveTradeCustomFieldValue(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-custom-field-values', vars.tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteTradeCustomFieldValue() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      deleteTradeCustomFieldValue(id).then(() => tradeId),
    onSuccess: (tradeId) => {
      void qc.invalidateQueries({ queryKey: ['trade-custom-field-values', tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}

export function useLegCustomFieldValues(legId: number | null) {
  return useQuery({
    queryKey: ['leg-custom-field-values', legId],
    queryFn: () => fetchLegCustomFieldValues(legId!),
    enabled: legId !== null,
    staleTime: STALE,
  });
}

export function useSaveLegCustomFieldValue() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: TradeLegCustomFieldValueInput) => saveLegCustomFieldValue(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['leg-custom-field-values', vars.legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteLegCustomFieldValue() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, legId }: { id: number; legId: number }) =>
      deleteLegCustomFieldValue(id).then(() => legId),
    onSuccess: (legId) => {
      void qc.invalidateQueries({ queryKey: ['leg-custom-field-values', legId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}
