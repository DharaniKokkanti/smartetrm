import type { Trade, TradeInput, TradeFilter, TradeOrder, TradeOrderInput, TradeItem, TradeItemInput } from './types';

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

// ─── Reference data dropdowns ─────────────────────────────────────────────────

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
