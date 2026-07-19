import { apiClient } from '@services/api';
import type {
  LegalEntity, LegalEntityInput,
  LegalEntityOwnership, LegalEntityOwnershipInput, LegalEntityOwnershipListView,
} from './types';
import { fetchEntityAddresses, fetchEntityContacts, fetchEntityTaxRegistrations } from '@features/tier1/counterparty/api';

/**
 * REST contract per the Master Data Entry Technical Design (Tier 1 pattern):
 * one controller per entity, standard CRUD verbs, soft-delete via a
 * dedicated deactivate endpoint rather than DELETE — legal_entity is
 * referenced by trades/positions/books, so it must never be hard-deleted.
 */
const BASE = '/legal-entities';

export const legalEntityApi = {
  list: async (): Promise<LegalEntity[]> => {
    const { data } = await apiClient.get<LegalEntity[]>(BASE);
    return data;
  },

  get: async (id: number): Promise<LegalEntity> => {
    const { data } = await apiClient.get<LegalEntity>(`${BASE}/${id}`);
    return data;
  },

  create: async (input: LegalEntityInput): Promise<LegalEntity> => {
    const { data } = await apiClient.post<LegalEntity>(BASE, input);
    return data;
  },

  update: async (id: number, input: LegalEntityInput): Promise<LegalEntity> => {
    const { data } = await apiClient.put<LegalEntity>(`${BASE}/${id}`, input);
    return data;
  },

  deactivate: async (id: number): Promise<void> => {
    await apiClient.patch(`${BASE}/${id}/deactivate`);
  },

  /** Bulk create from a validated Excel upload — one call, server applies
   *  the same duplicate-rejection rule row-by-row and reports back which
   *  rows failed, rather than the client trying to guess server-side state. */
  bulkCreate: async (
    inputs: LegalEntityInput[],
  ): Promise<{ created: LegalEntity[]; rejected: { row: LegalEntityInput; reason: string }[] }> => {
    const { data } = await apiClient.post(`${BASE}/bulk`, { entities: inputs });
    return data;
  },

  // ── legal_entity_ownership sub-resource (V125) — a JV entity's cap table ──

  listOwnership: async (jvEntityId: number): Promise<LegalEntityOwnershipListView> => {
    const { data } = await apiClient.get<LegalEntityOwnershipListView>(`${BASE}/${jvEntityId}/ownership`);
    return data;
  },

  addOwnership: async (jvEntityId: number, input: LegalEntityOwnershipInput): Promise<LegalEntityOwnership> => {
    const { data } = await apiClient.post<LegalEntityOwnership>(`${BASE}/${jvEntityId}/ownership`, input);
    return data;
  },

  removeOwnership: async (jvEntityId: number, ownershipId: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${jvEntityId}/ownership/${ownershipId}`);
  },
};

/** Fetch a legal entity's full child record set in parallel — same shape as
 *  fetchCounterpartyChildren, minus bank accounts (a Counterparty-only concept). */
export async function fetchLegalEntityChildren(id: number) {
  const [contacts, addresses, taxRegistrations] = await Promise.all([
    fetchEntityContacts('LEGAL_ENTITY', id),
    fetchEntityAddresses('LEGAL_ENTITY', id),
    fetchEntityTaxRegistrations('LEGAL_ENTITY', id),
  ]);
  return { contacts, addresses, taxRegistrations };
}
