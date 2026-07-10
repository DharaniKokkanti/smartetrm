import type {
  Trade, TradeInput, TradeFilter, TradeOrder, TradeOrderInput, TradeItem, TradeItemInput,
  TradeCost, TradeCostInput, TradeOrderCost, TradeOrderCostInput, TradeAssayResult, TradeAssayResultInput,
  CustomFieldDefinition, CustomFieldDefinitionInput, TradeCustomFieldValue, TradeCustomFieldValueInput,
  TradeOrderCustomFieldValue, TradeOrderCustomFieldValueInput,
} from './types';

const BASE = '/api/v1';

// ─── Trades ───────────────────────────────────────────────────────────────────

export async function fetchTrades(filter: TradeFilter = {}): Promise<Trade[]> {
  const params = new URLSearchParams();
  if (filter.commodityType) params.set('commodityType', filter.commodityType);
  if (filter.status) params.set('status', filter.status);
  if (filter.direction) params.set('direction', filter.direction);
  const qs = params.toString();
  const res = await fetch(`${BASE}/trades${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error('Failed to fetch trades');
  return res.json() as Promise<Trade[]>;
}

export async function fetchTrade(id: number): Promise<Trade> {
  const res = await fetch(`${BASE}/trades/${id}`);
  if (!res.ok) throw new Error('Trade not found');
  return res.json() as Promise<Trade>;
}

export async function createTrade(input: TradeInput): Promise<Trade> {
  const res = await fetch(`${BASE}/trades`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to create trade');
  return res.json() as Promise<Trade>;
}

export async function updateTrade(id: number, input: Partial<TradeInput>): Promise<Trade> {
  const res = await fetch(`${BASE}/trades/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to update trade');
  return res.json() as Promise<Trade>;
}

export async function cancelTrade(id: number): Promise<Trade> {
  const res = await fetch(`${BASE}/trades/${id}/cancel`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to cancel trade');
  return res.json() as Promise<Trade>;
}

export async function confirmTrade(id: number): Promise<Trade> {
  const res = await fetch(`${BASE}/trades/${id}/confirm`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to confirm trade');
  return res.json() as Promise<Trade>;
}

// ─── Trade Orders ─────────────────────────────────────────────────────────────

export async function fetchTradeOrders(tradeId: number): Promise<TradeOrder[]> {
  const res = await fetch(`${BASE}/trade-orders?tradeId=${tradeId}`);
  if (!res.ok) throw new Error('Failed to fetch orders');
  return res.json() as Promise<TradeOrder[]>;
}

export async function createTradeOrder(input: TradeOrderInput): Promise<TradeOrder> {
  const res = await fetch(`${BASE}/trade-orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to create order');
  return res.json() as Promise<TradeOrder>;
}

export async function updateTradeOrder(id: number, input: Partial<TradeOrderInput>): Promise<TradeOrder> {
  const res = await fetch(`${BASE}/trade-orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to update order');
  return res.json() as Promise<TradeOrder>;
}

export async function cancelTradeOrder(id: number): Promise<TradeOrder> {
  const res = await fetch(`${BASE}/trade-orders/${id}/cancel`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to cancel order');
  return res.json() as Promise<TradeOrder>;
}

export async function confirmTradeOrder(id: number): Promise<TradeOrder> {
  const res = await fetch(`${BASE}/trade-orders/${id}/confirm`, { method: 'PATCH' });
  if (!res.ok) throw new Error('Failed to confirm order');
  return res.json() as Promise<TradeOrder>;
}

// ─── Trade Items ──────────────────────────────────────────────────────────────

export async function fetchTradeItems(orderId: number): Promise<TradeItem[]> {
  const res = await fetch(`${BASE}/trade-items?orderId=${orderId}`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json() as Promise<TradeItem[]>;
}

export async function createTradeItem(input: TradeItemInput): Promise<TradeItem> {
  const res = await fetch(`${BASE}/trade-items`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to create item');
  return res.json() as Promise<TradeItem>;
}

export async function updateTradeItem(id: number, input: Partial<TradeItemInput>): Promise<TradeItem> {
  const res = await fetch(`${BASE}/trade-items/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to update item');
  return res.json() as Promise<TradeItem>;
}

export async function deleteTradeItem(id: number): Promise<void> {
  const res = await fetch(`${BASE}/trade-items/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete item');
}

// ─── Trade Costs (trade-level secondary costs, V88) ──────────────────────────

export async function fetchTradeCosts(tradeId: number): Promise<TradeCost[]> {
  const res = await fetch(`${BASE}/trade-costs?tradeId=${tradeId}`);
  if (!res.ok) throw new Error('Failed to fetch trade costs');
  return res.json() as Promise<TradeCost[]>;
}

export async function createTradeCost(input: TradeCostInput): Promise<TradeCost> {
  const res = await fetch(`${BASE}/trade-costs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to create trade cost');
  return res.json() as Promise<TradeCost>;
}

export async function updateTradeCost(id: number, input: Partial<TradeCostInput>): Promise<TradeCost> {
  const res = await fetch(`${BASE}/trade-costs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to update trade cost');
  return res.json() as Promise<TradeCost>;
}

export async function deleteTradeCost(id: number): Promise<void> {
  const res = await fetch(`${BASE}/trade-costs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete trade cost');
}

// ─── Leg Costs (order-level secondary costs, V88) ────────────────────────────

export async function fetchLegCosts(orderId: number): Promise<TradeOrderCost[]> {
  const res = await fetch(`${BASE}/trade-order-costs?orderId=${orderId}`);
  if (!res.ok) throw new Error('Failed to fetch leg costs');
  return res.json() as Promise<TradeOrderCost[]>;
}

export async function createLegCost(input: TradeOrderCostInput): Promise<TradeOrderCost> {
  const res = await fetch(`${BASE}/trade-order-costs`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to create leg cost');
  return res.json() as Promise<TradeOrderCost>;
}

export async function updateLegCost(id: number, input: Partial<TradeOrderCostInput>): Promise<TradeOrderCost> {
  const res = await fetch(`${BASE}/trade-order-costs/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to update leg cost');
  return res.json() as Promise<TradeOrderCost>;
}

export async function deleteLegCost(id: number): Promise<void> {
  const res = await fetch(`${BASE}/trade-order-costs/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete leg cost');
}

// ─── Assay Results (physical-leg quality results, V88) ───────────────────────

export async function fetchAssayResults(orderId: number): Promise<TradeAssayResult[]> {
  const res = await fetch(`${BASE}/trade-order-assay-results?orderId=${orderId}`);
  if (!res.ok) throw new Error('Failed to fetch assay results');
  return res.json() as Promise<TradeAssayResult[]>;
}

export async function createAssayResult(input: TradeAssayResultInput): Promise<TradeAssayResult> {
  const res = await fetch(`${BASE}/trade-order-assay-results`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to create assay result');
  return res.json() as Promise<TradeAssayResult>;
}

export async function updateAssayResult(id: number, input: Partial<TradeAssayResultInput>): Promise<TradeAssayResult> {
  const res = await fetch(`${BASE}/trade-order-assay-results/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to update assay result');
  return res.json() as Promise<TradeAssayResult>;
}

export async function deleteAssayResult(id: number): Promise<void> {
  const res = await fetch(`${BASE}/trade-order-assay-results/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete assay result');
}

// ─── Custom field definitions (governed registry, V89) ────────────────────────

export async function fetchCustomFieldDefinitions(): Promise<CustomFieldDefinition[]> {
  const res = await fetch(`${BASE}/custom-field-definitions`);
  if (!res.ok) throw new Error('Failed to fetch custom field definitions');
  return res.json() as Promise<CustomFieldDefinition[]>;
}

export async function createCustomFieldDefinition(input: CustomFieldDefinitionInput): Promise<CustomFieldDefinition> {
  const res = await fetch(`${BASE}/custom-field-definitions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to create custom field definition');
  return res.json() as Promise<CustomFieldDefinition>;
}

export async function updateCustomFieldDefinition(id: number, input: Partial<CustomFieldDefinitionInput>): Promise<CustomFieldDefinition> {
  const res = await fetch(`${BASE}/custom-field-definitions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to update custom field definition');
  return res.json() as Promise<CustomFieldDefinition>;
}

// ─── Trade-level custom field values (V89) ────────────────────────────────────

export async function fetchTradeCustomFieldValues(tradeId: number): Promise<TradeCustomFieldValue[]> {
  const res = await fetch(`${BASE}/trade-custom-field-values?tradeId=${tradeId}`);
  if (!res.ok) throw new Error('Failed to fetch trade custom field values');
  return res.json() as Promise<TradeCustomFieldValue[]>;
}

export async function saveTradeCustomFieldValue(input: TradeCustomFieldValueInput): Promise<TradeCustomFieldValue> {
  const res = await fetch(`${BASE}/trade-custom-field-values`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to save trade custom field value');
  return res.json() as Promise<TradeCustomFieldValue>;
}

export async function deleteTradeCustomFieldValue(id: number): Promise<void> {
  const res = await fetch(`${BASE}/trade-custom-field-values/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete trade custom field value');
}

// ─── Leg-level custom field values (V89) ──────────────────────────────────────

export async function fetchLegCustomFieldValues(orderId: number): Promise<TradeOrderCustomFieldValue[]> {
  const res = await fetch(`${BASE}/trade-order-custom-field-values?orderId=${orderId}`);
  if (!res.ok) throw new Error('Failed to fetch leg custom field values');
  return res.json() as Promise<TradeOrderCustomFieldValue[]>;
}

export async function saveLegCustomFieldValue(input: TradeOrderCustomFieldValueInput): Promise<TradeOrderCustomFieldValue> {
  const res = await fetch(`${BASE}/trade-order-custom-field-values`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
  if (!res.ok) throw new Error('Failed to save leg custom field value');
  return res.json() as Promise<TradeOrderCustomFieldValue>;
}

export async function deleteLegCustomFieldValue(id: number): Promise<void> {
  const res = await fetch(`${BASE}/trade-order-custom-field-values/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete leg custom field value');
}

// ─── Reference data dropdowns ─────────────────────────────────────────────────

// NOTE: these declared shapes are stale — /counterparties and /legal-entities
// are actually served by the tier1 handlers (registered before etrmHandlers in
// mocks/browser.ts), whose rows use cpCode/legalName and entityCode/entityName.
// ~12 consuming pages cast to this stale shape, so labels built from
// counterpartyCode/name render "undefined" at runtime. Kept as-is here to
// avoid a mass ripple; fix consumers to cpCode/legalName as they're touched
// (TradeBlotter already reads the real fields).
export interface Counterparty { counterpartyId: number; counterpartyCode: string; name: string; }
export interface LegalEntity { legalEntityId: number; entityCode: string; name: string; }
export interface Incoterm { incotermId: number; incotermCode: string; incotermName: string; }
export interface BrokerRef { brokerId: number; brokerCode: string; brokerName: string; isActive: boolean; }
export interface PipelineRef { pipelineId: number; pipelineCode: string; pipelineName: string; pipelineType: string; }

export async function fetchCounterparties(): Promise<Counterparty[]> {
  const res = await fetch(`${BASE}/counterparties`);
  return res.json() as Promise<Counterparty[]>;
}
export async function fetchLegalEntities(): Promise<LegalEntity[]> {
  const res = await fetch(`${BASE}/legal-entities`);
  return res.json() as Promise<LegalEntity[]>;
}
export async function fetchIncoterms(): Promise<Incoterm[]> {
  const res = await fetch(`${BASE}/incoterms`);
  return res.json() as Promise<Incoterm[]>;
}
export async function fetchBrokers(): Promise<BrokerRef[]> {
  const res = await fetch(`${BASE}/brokers`);
  return res.json() as Promise<BrokerRef[]>;
}
export async function fetchPipelines(): Promise<PipelineRef[]> {
  const res = await fetch(`${BASE}/pipelines`);
  return res.json() as Promise<PipelineRef[]>;
}
