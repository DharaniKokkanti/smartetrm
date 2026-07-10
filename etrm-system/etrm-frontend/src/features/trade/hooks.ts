import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import {
  fetchTrades, createTrade, updateTrade, cancelTrade, confirmTrade,
  fetchCounterparties, fetchLegalEntities, fetchIncoterms, fetchBrokers, fetchPipelines,
  fetchTradeOrders, createTradeOrder, updateTradeOrder, cancelTradeOrder, confirmTradeOrder,
  fetchTradeItems, createTradeItem, updateTradeItem, deleteTradeItem,
  fetchTradeCosts, createTradeCost, updateTradeCost, deleteTradeCost,
  fetchLegCosts, createLegCost, updateLegCost, deleteLegCost,
  fetchAssayResults, createAssayResult, updateAssayResult, deleteAssayResult,
  fetchCustomFieldDefinitions, createCustomFieldDefinition, updateCustomFieldDefinition,
  fetchTradeCustomFieldValues, saveTradeCustomFieldValue, deleteTradeCustomFieldValue,
  fetchLegCustomFieldValues, saveLegCustomFieldValue, deleteLegCustomFieldValue,
} from './api';
import type {
  TradeInput, TradeFilter, TradeOrderInput, TradeItemInput,
  TradeCostInput, TradeOrderCostInput, TradeAssayResultInput,
  CustomFieldDefinitionInput, TradeCustomFieldValueInput, TradeOrderCustomFieldValueInput,
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
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeOrderInput }) =>
      id ? updateTradeOrder(id, input) : createTradeOrder(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-orders', vars.input.tradeId] });
      void qc.invalidateQueries({ queryKey: ['trades'] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useCancelTradeOrder() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      cancelTradeOrder(id).then((r) => ({ r, tradeId })),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['trade-orders', res.tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Cancel failed.'),
  });
}

export function useConfirmTradeOrder() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, tradeId }: { id: number; tradeId: number }) =>
      confirmTradeOrder(id).then((r) => ({ r, tradeId })),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['trade-orders', res.tradeId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Confirm failed.'),
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
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeItemInput }) =>
      id ? updateTradeItem(id, input) : createTradeItem(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['trade-items', vars.input.orderId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteTradeItem() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, orderId }: { id: number; orderId: number }) =>
      deleteTradeItem(id).then(() => orderId),
    onSuccess: (orderId) => {
      void qc.invalidateQueries({ queryKey: ['trade-items', orderId] });
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

// ─── Leg Costs (order-level secondary costs, V88) ────────────────────────────

export function useLegCosts(orderId: number | null) {
  return useQuery({
    queryKey: ['leg-costs', orderId],
    queryFn: () => fetchLegCosts(orderId!),
    enabled: orderId !== null,
    staleTime: STALE,
  });
}

export function useSaveLegCost() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TradeOrderCostInput }) =>
      id ? updateLegCost(id, input) : createLegCost(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['leg-costs', vars.input.orderId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteLegCost() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, orderId }: { id: number; orderId: number }) =>
      deleteLegCost(id).then(() => orderId),
    onSuccess: (orderId) => {
      void qc.invalidateQueries({ queryKey: ['leg-costs', orderId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}

// ─── Assay Results (physical-leg quality results, V88) ───────────────────────

export function useAssayResults(orderId: number | null) {
  return useQuery({
    queryKey: ['assay-results', orderId],
    queryFn: () => fetchAssayResults(orderId!),
    enabled: orderId !== null,
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
      void qc.invalidateQueries({ queryKey: ['assay-results', vars.input.orderId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteAssayResult() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, orderId }: { id: number; orderId: number }) =>
      deleteAssayResult(id).then(() => orderId),
    onSuccess: (orderId) => {
      void qc.invalidateQueries({ queryKey: ['assay-results', orderId] });
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

export function useLegCustomFieldValues(orderId: number | null) {
  return useQuery({
    queryKey: ['leg-custom-field-values', orderId],
    queryFn: () => fetchLegCustomFieldValues(orderId!),
    enabled: orderId !== null,
    staleTime: STALE,
  });
}

export function useSaveLegCustomFieldValue() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: TradeOrderCustomFieldValueInput) => saveLegCustomFieldValue(input),
    onSuccess: (_, vars) => {
      void qc.invalidateQueries({ queryKey: ['leg-custom-field-values', vars.orderId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteLegCustomFieldValue() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, orderId }: { id: number; orderId: number }) =>
      deleteLegCustomFieldValue(id).then(() => orderId),
    onSuccess: (orderId) => {
      void qc.invalidateQueries({ queryKey: ['leg-custom-field-values', orderId] });
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}
