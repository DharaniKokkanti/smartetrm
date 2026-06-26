import { apiClient } from '@services/api';
import type {
  Counterparty,
  CounterpartyInput,
  Contact,
  BankAccount,
  Address,
} from './types';

const BASE = '/counterparties';

export const counterpartyApi = {
  list: async (): Promise<Counterparty[]> => {
    const { data } = await apiClient.get<Counterparty[]>(BASE);
    return data;
  },
  get: async (id: number): Promise<Counterparty> => {
    const { data } = await apiClient.get<Counterparty>(`${BASE}/${id}`);
    return data;
  },
  create: async (input: CounterpartyInput): Promise<Counterparty> => {
    const { data } = await apiClient.post<Counterparty>(BASE, input);
    return data;
  },
  update: async (id: number, input: CounterpartyInput): Promise<Counterparty> => {
    const { data } = await apiClient.put<Counterparty>(`${BASE}/${id}`, input);
    return data;
  },
  deactivate: async (id: number): Promise<void> => {
    await apiClient.patch(`${BASE}/${id}/deactivate`);
  },

  // ── Nested children — same REST shape the original prototype used ────────
  contacts: {
    create: async (cpId: number, c: Omit<Contact, 'contactId' | '_localId'>): Promise<Contact> => {
      const { data } = await apiClient.post<Contact>(`${BASE}/${cpId}/contacts`, c);
      return data;
    },
    update: async (
      cpId: number,
      contactId: number,
      c: Omit<Contact, 'contactId' | '_localId'>,
    ): Promise<Contact> => {
      const { data } = await apiClient.put<Contact>(`${BASE}/${cpId}/contacts/${contactId}`, c);
      return data;
    },
  },
  bankAccounts: {
    create: async (
      cpId: number,
      b: Omit<BankAccount, 'bankAccountId' | '_localId'>,
    ): Promise<BankAccount> => {
      const { data } = await apiClient.post<BankAccount>(`${BASE}/${cpId}/bank-accounts`, b);
      return data;
    },
    update: async (
      cpId: number,
      bankAccountId: number,
      b: Omit<BankAccount, 'bankAccountId' | '_localId'>,
    ): Promise<BankAccount> => {
      const { data } = await apiClient.put<BankAccount>(
        `${BASE}/${cpId}/bank-accounts/${bankAccountId}`,
        b,
      );
      return data;
    },
  },
  addresses: {
    create: async (cpId: number, a: Omit<Address, 'addressId' | '_localId'>): Promise<Address> => {
      const { data } = await apiClient.post<Address>(`${BASE}/${cpId}/addresses`, a);
      return data;
    },
    update: async (
      cpId: number,
      addressId: number,
      a: Omit<Address, 'addressId' | '_localId'>,
    ): Promise<Address> => {
      const { data } = await apiClient.put<Address>(`${BASE}/${cpId}/addresses/${addressId}`, a);
      return data;
    },
  },
};

/** Fetch a counterparty's full child record set in parallel — used when
 *  opening the edit form, since the list endpoint only returns core fields. */
export async function fetchCounterpartyChildren(cpId: number) {
  const [contacts, bankAccounts, addresses] = await Promise.all([
    apiClient.get<Contact[]>(`${BASE}/${cpId}/contacts`).then((r) => r.data),
    apiClient.get<BankAccount[]>(`${BASE}/${cpId}/bank-accounts`).then((r) => r.data),
    apiClient.get<Address[]>(`${BASE}/${cpId}/addresses`).then((r) => r.data),
  ]);
  return { contacts, bankAccounts, addresses };
}
