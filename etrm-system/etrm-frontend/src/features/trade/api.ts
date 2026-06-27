import type { Trade, TradeInput, TradeFilter } from './types';

const BASE = '/api/v1';

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

// Reference data for dropdowns
export interface Counterparty { counterpartyId: number; counterpartyCode: string; name: string; }
export interface LegalEntity { legalEntityId: number; entityCode: string; name: string; }
export interface Incoterm { incotermId: number; incotermCode: string; incotermName: string; }

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
