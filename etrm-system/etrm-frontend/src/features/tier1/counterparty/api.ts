import { apiClient } from '@services/api';
import type {
  Counterparty,
  CounterpartyInput,
  Contact,
  ContactAssignment,
  BankAccount,
  Address,
  AddressAssignment,
  PolymorphicEntityType,
  TaxRegistration,
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

  bankAccounts: {
    /** Every bank account across every counterparty — used by the
     *  cross-entity Bank Accounts Directory page. */
    listAll: async (): Promise<BankAccount[]> => {
      const { data } = await apiClient.get<BankAccount[]>('/bank-accounts');
      return data;
    },
    create: async (cpId: number, b: Omit<BankAccount, 'bankAccountId' | '_localId'>): Promise<BankAccount> => {
      const { data } = await apiClient.post<BankAccount>(`${BASE}/${cpId}/bank-accounts`, b);
      return data;
    },
    update: async (cpId: number, bankAccountId: number, b: Omit<BankAccount, 'bankAccountId' | '_localId'>): Promise<BankAccount> => {
      const { data } = await apiClient.put<BankAccount>(`${BASE}/${cpId}/bank-accounts/${bankAccountId}`, b);
      return data;
    },
  },
};

// ── Address pool ──────────────────────────────────────────────────────────────

export const addressApi = {
  pool: async (): Promise<Address[]> => {
    const { data } = await apiClient.get<Address[]>('/addresses');
    return data;
  },
  updatePool: async (addressId: number, a: Omit<Address, 'addressId' | '_localId'>): Promise<Address> => {
    const { data } = await apiClient.put<Address>(`/addresses/${addressId}`, a);
    return data;
  },
};

// ── Address assignments (entity_address) ─────────────────────────────────────

export async function fetchEntityAddresses(entityType: PolymorphicEntityType, entityId: number): Promise<AddressAssignment[]> {
  const { data } = await apiClient.get<AddressAssignment[]>(
    `/entity-addresses?entityType=${entityType}&entityId=${entityId}`,
  );
  return data;
}

export async function saveAddressAssignment(
  assignment: AddressAssignment,
): Promise<AddressAssignment> {
  if (assignment.entityAddressId !== null) {
    // update existing assignment (and optionally its pool record if not linked)
    const { data } = await apiClient.put<AddressAssignment>(
      `/entity-addresses/${assignment.entityAddressId}`,
      assignment,
    );
    return data;
  }
  // create: POST carries either addressId (link) or full address data (new)
  const { data } = await apiClient.post<AddressAssignment>('/entity-addresses', {
    entityType: assignment.entityType,
    entityId: assignment.entityId,
    addressType: assignment.addressType,
    isPrimary: assignment.isPrimary,
    isLinked: assignment.isLinked,
    ...(assignment.isLinked
      ? { addressId: assignment.addressId }
      : { address: assignment.address }),
  });
  return data;
}

export async function deactivateAddressAssignment(entityAddressId: number): Promise<void> {
  await apiClient.patch(`/entity-addresses/${entityAddressId}/deactivate`);
}

// ── Contact pool ──────────────────────────────────────────────────────────────

export const contactApi = {
  pool: async (): Promise<Contact[]> => {
    const { data } = await apiClient.get<Contact[]>('/contacts');
    return data;
  },
};

// ── Contact assignments (entity_contact) ─────────────────────────────────────

export async function fetchEntityContacts(entityType: PolymorphicEntityType, entityId: number): Promise<ContactAssignment[]> {
  const { data } = await apiClient.get<ContactAssignment[]>(
    `/entity-contacts?entityType=${entityType}&entityId=${entityId}`,
  );
  return data;
}

/** Every contact assignment across every entity — used by the cross-entity
 *  Contacts Directory page (not scoped to one counterparty/legal entity). */
export async function fetchAllContactAssignments(): Promise<ContactAssignment[]> {
  const { data } = await apiClient.get<ContactAssignment[]>('/entity-contacts');
  return data;
}

export async function saveContactAssignment(
  assignment: ContactAssignment,
): Promise<ContactAssignment> {
  if (assignment.entityContactId !== null) {
    const { data } = await apiClient.put<ContactAssignment>(
      `/entity-contacts/${assignment.entityContactId}`,
      assignment,
    );
    return data;
  }
  const { data } = await apiClient.post<ContactAssignment>('/entity-contacts', {
    entityType: assignment.entityType,
    entityId: assignment.entityId,
    contactRole: assignment.contactRole,
    isPrimary: assignment.isPrimary,
    isLinked: assignment.isLinked,
    ...(assignment.isLinked
      ? { contactId: assignment.contactId }
      : { contact: assignment.contact }),
  });
  return data;
}

export async function deactivateContactAssignment(entityContactId: number): Promise<void> {
  await apiClient.patch(`/entity-contacts/${entityContactId}/deactivate`);
}

// ── Tax registrations (dbo.tax_registration) ──────────────────────────────────
// Polymorphic like addresses/contacts (entity_type + entity_id), no pool
// concept — each registration belongs to exactly one entity.

export async function fetchEntityTaxRegistrations(entityType: PolymorphicEntityType, entityId: number): Promise<TaxRegistration[]> {
  const { data } = await apiClient.get<TaxRegistration[]>(
    `/entity-tax-registrations?entityType=${entityType}&entityId=${entityId}`,
  );
  return data;
}

/** Every tax registration across every entity — used by the cross-entity
 *  Tax Registrations Directory page (not scoped to one entity). */
export async function fetchAllTaxRegistrations(): Promise<TaxRegistration[]> {
  const { data } = await apiClient.get<TaxRegistration[]>('/entity-tax-registrations');
  return data;
}

export async function saveTaxRegistrationAssignment(reg: TaxRegistration): Promise<TaxRegistration> {
  if (reg.taxRegId !== null) {
    const { data } = await apiClient.put<TaxRegistration>(`/entity-tax-registrations/${reg.taxRegId}`, reg);
    return data;
  }
  const { data } = await apiClient.post<TaxRegistration>('/entity-tax-registrations', reg);
  return data;
}

export async function deactivateTaxRegistrationAssignment(taxRegId: number): Promise<void> {
  await apiClient.patch(`/entity-tax-registrations/${taxRegId}/deactivate`);
}

/** Fetch a counterparty's full child record set in parallel. */
export async function fetchCounterpartyChildren(cpId: number) {
  const [contacts, bankAccounts, addresses, taxRegistrations] = await Promise.all([
    fetchEntityContacts('COUNTERPARTY', cpId),
    apiClient.get<BankAccount[]>(`${BASE}/${cpId}/bank-accounts`).then((r) => r.data),
    fetchEntityAddresses('COUNTERPARTY', cpId),
    fetchEntityTaxRegistrations('COUNTERPARTY', cpId),
  ]);
  return { contacts, bankAccounts, addresses, taxRegistrations };
}
