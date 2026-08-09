import type {
  Trade, TradeInput, TradeFilter, TradeOrder, TradeOrderInput, TradeItem, TradeItemInput,
  TradeCost, TradeCostInput, TradeOrderCost, TradeOrderCostInput, TradeAssayResult, TradeAssayResultInput,
  CustomFieldDefinition, CustomFieldDefinitionInput, TradeCustomFieldValue, TradeCustomFieldValueInput,
  TradeOrderCustomFieldValue, TradeOrderCustomFieldValueInput, CommodityTypeTrade,
} from './types';
import type { Counterparty } from '@features/tier1/counterparty/types';
import type { LegalEntity } from '@features/tier1/legal-entity/types';
import { apiClient } from '@services/api';

export type { Counterparty, LegalEntity };

// All calls in this file go through apiClient (not raw fetch) — they need
// the Authorization header against the real backend. Raw fetch() used to
// work here because MSW mocks intercept fetch() regardless of headers, but
// silently 403s against the real backend (confirmed for /pipelines et al.
// during the 2026-08-09 master-data audit — see handoff doc §0).

// ─── Trades ───────────────────────────────────────────────────────────────────

export async function fetchTrades(filter: TradeFilter = {}): Promise<Trade[]> {
  const params: Record<string, string> = {};
  if (filter.commodityType) params.commodityType = filter.commodityType;
  if (filter.status) params.status = filter.status;
  if (filter.direction) params.direction = filter.direction;
  return apiClient.get<Trade[]>('/trades', { params }).then((r) => r.data);
}

export async function fetchTrade(id: number): Promise<Trade> {
  return apiClient.get<Trade>(`/trades/${id}`).then((r) => r.data);
}

export async function createTrade(input: TradeInput): Promise<Trade> {
  return apiClient.post<Trade>('/trades', input).then((r) => r.data);
}

export async function updateTrade(id: number, input: Partial<TradeInput>): Promise<Trade> {
  return apiClient.put<Trade>(`/trades/${id}`, input).then((r) => r.data);
}

export async function cancelTrade(id: number): Promise<Trade> {
  return apiClient.patch<Trade>(`/trades/${id}/cancel`).then((r) => r.data);
}

export async function confirmTrade(id: number): Promise<Trade> {
  return apiClient.patch<Trade>(`/trades/${id}/confirm`).then((r) => r.data);
}

// ─── Trade Orders ─────────────────────────────────────────────────────────────

export async function fetchTradeOrders(tradeId: number): Promise<TradeOrder[]> {
  return apiClient.get<TradeOrder[]>('/trade-orders', { params: { tradeId } }).then((r) => r.data);
}

export async function createTradeOrder(input: TradeOrderInput): Promise<TradeOrder> {
  return apiClient.post<TradeOrder>('/trade-orders', input).then((r) => r.data);
}

export async function updateTradeOrder(id: number, input: Partial<TradeOrderInput>): Promise<TradeOrder> {
  return apiClient.put<TradeOrder>(`/trade-orders/${id}`, input).then((r) => r.data);
}

export async function cancelTradeOrder(id: number): Promise<TradeOrder> {
  return apiClient.patch<TradeOrder>(`/trade-orders/${id}/cancel`).then((r) => r.data);
}

export async function confirmTradeOrder(id: number): Promise<TradeOrder> {
  return apiClient.patch<TradeOrder>(`/trade-orders/${id}/confirm`).then((r) => r.data);
}

// ─── Trade Items ──────────────────────────────────────────────────────────────

export async function fetchTradeItems(orderId: number): Promise<TradeItem[]> {
  return apiClient.get<TradeItem[]>('/trade-items', { params: { orderId } }).then((r) => r.data);
}

export async function createTradeItem(input: TradeItemInput): Promise<TradeItem> {
  return apiClient.post<TradeItem>('/trade-items', input).then((r) => r.data);
}

export async function updateTradeItem(id: number, input: Partial<TradeItemInput>): Promise<TradeItem> {
  return apiClient.put<TradeItem>(`/trade-items/${id}`, input).then((r) => r.data);
}

export async function deleteTradeItem(id: number): Promise<void> {
  await apiClient.delete(`/trade-items/${id}`);
}

// ─── Trade Costs (trade-level secondary costs, V88) ──────────────────────────

export async function fetchTradeCosts(tradeId: number): Promise<TradeCost[]> {
  return apiClient.get<TradeCost[]>('/trade-costs', { params: { tradeId } }).then((r) => r.data);
}

export async function createTradeCost(input: TradeCostInput): Promise<TradeCost> {
  return apiClient.post<TradeCost>('/trade-costs', input).then((r) => r.data);
}

export async function updateTradeCost(id: number, input: Partial<TradeCostInput>): Promise<TradeCost> {
  return apiClient.put<TradeCost>(`/trade-costs/${id}`, input).then((r) => r.data);
}

export async function deleteTradeCost(id: number): Promise<void> {
  await apiClient.delete(`/trade-costs/${id}`);
}

// ─── Leg Costs (order-level secondary costs, V88) ────────────────────────────

export async function fetchLegCosts(orderId: number): Promise<TradeOrderCost[]> {
  return apiClient.get<TradeOrderCost[]>('/trade-order-costs', { params: { orderId } }).then((r) => r.data);
}

export async function createLegCost(input: TradeOrderCostInput): Promise<TradeOrderCost> {
  return apiClient.post<TradeOrderCost>('/trade-order-costs', input).then((r) => r.data);
}

export async function updateLegCost(id: number, input: Partial<TradeOrderCostInput>): Promise<TradeOrderCost> {
  return apiClient.put<TradeOrderCost>(`/trade-order-costs/${id}`, input).then((r) => r.data);
}

export async function deleteLegCost(id: number): Promise<void> {
  await apiClient.delete(`/trade-order-costs/${id}`);
}

// ─── Assay Results (physical-leg quality results, V88) ───────────────────────

export async function fetchAssayResults(orderId: number): Promise<TradeAssayResult[]> {
  return apiClient.get<TradeAssayResult[]>('/trade-order-assay-results', { params: { orderId } }).then((r) => r.data);
}

export async function createAssayResult(input: TradeAssayResultInput): Promise<TradeAssayResult> {
  return apiClient.post<TradeAssayResult>('/trade-order-assay-results', input).then((r) => r.data);
}

export async function updateAssayResult(id: number, input: Partial<TradeAssayResultInput>): Promise<TradeAssayResult> {
  return apiClient.put<TradeAssayResult>(`/trade-order-assay-results/${id}`, input).then((r) => r.data);
}

export async function deleteAssayResult(id: number): Promise<void> {
  await apiClient.delete(`/trade-order-assay-results/${id}`);
}

// ─── Custom field definitions (governed registry, V89) ────────────────────────

export async function fetchCustomFieldDefinitions(): Promise<CustomFieldDefinition[]> {
  return apiClient.get<CustomFieldDefinition[]>('/custom-field-definitions').then((r) => r.data);
}

export async function createCustomFieldDefinition(input: CustomFieldDefinitionInput): Promise<CustomFieldDefinition> {
  return apiClient.post<CustomFieldDefinition>('/custom-field-definitions', input).then((r) => r.data);
}

export async function updateCustomFieldDefinition(id: number, input: Partial<CustomFieldDefinitionInput>): Promise<CustomFieldDefinition> {
  return apiClient.put<CustomFieldDefinition>(`/custom-field-definitions/${id}`, input).then((r) => r.data);
}

// ─── Trade-level custom field values (V89) ────────────────────────────────────

export async function fetchTradeCustomFieldValues(tradeId: number): Promise<TradeCustomFieldValue[]> {
  return apiClient.get<TradeCustomFieldValue[]>('/trade-custom-field-values', { params: { tradeId } }).then((r) => r.data);
}

export async function saveTradeCustomFieldValue(input: TradeCustomFieldValueInput): Promise<TradeCustomFieldValue> {
  return apiClient.post<TradeCustomFieldValue>('/trade-custom-field-values', input).then((r) => r.data);
}

export async function deleteTradeCustomFieldValue(id: number): Promise<void> {
  await apiClient.delete(`/trade-custom-field-values/${id}`);
}

// ─── Leg-level custom field values (V89) ──────────────────────────────────────

export async function fetchLegCustomFieldValues(orderId: number): Promise<TradeOrderCustomFieldValue[]> {
  return apiClient.get<TradeOrderCustomFieldValue[]>('/trade-order-custom-field-values', { params: { orderId } }).then((r) => r.data);
}

export async function saveLegCustomFieldValue(input: TradeOrderCustomFieldValueInput): Promise<TradeOrderCustomFieldValue> {
  return apiClient.post<TradeOrderCustomFieldValue>('/trade-order-custom-field-values', input).then((r) => r.data);
}

export async function deleteLegCustomFieldValue(id: number): Promise<void> {
  await apiClient.delete(`/trade-order-custom-field-values/${id}`);
}

// ─── Reference data dropdowns ─────────────────────────────────────────────────

// /counterparties and /legal-entities are actually served by the tier1
// handlers (registered before etrmHandlers in mocks/browser.ts) — Counterparty
// and LegalEntity above are the real tier1 row shapes, re-exported for callers
// that only need the reference-data subset.
export interface Incoterm { incotermId: number; incotermCode: string; incotermName: string; }
export interface BrokerRef { brokerId: number; brokerCode: string; brokerName: string; commodityType: CommodityTypeTrade | null; isActive: boolean; }
export interface PipelineRef { pipelineId: number; pipelineCode: string; pipelineName: string; pipelineType: string; }

export async function fetchCounterparties(): Promise<Counterparty[]> {
  return apiClient.get<Counterparty[]>('/counterparties').then((r) => r.data);
}
export async function fetchLegalEntities(): Promise<LegalEntity[]> {
  return apiClient.get<LegalEntity[]>('/legal-entities').then((r) => r.data);
}
export async function fetchIncoterms(): Promise<Incoterm[]> {
  return apiClient.get<Incoterm[]>('/incoterms').then((r) => r.data);
}
export async function fetchBrokers(): Promise<BrokerRef[]> {
  return apiClient.get<BrokerRef[]>('/brokers').then((r) => r.data);
}
export async function fetchPipelines(): Promise<PipelineRef[]> {
  return apiClient.get<PipelineRef[]>('/pipelines').then((r) => r.data);
}
