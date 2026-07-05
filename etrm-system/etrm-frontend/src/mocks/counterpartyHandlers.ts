import { http, HttpResponse } from 'msw';
import {
  counterpartySeed,
  contactPoolSeed,
  contactAssignmentSeed,
  bankAccountSeed,
  addressPoolSeed,
  addressAssignmentSeed,
  taxRegistrationSeed,
  nextCounterpartyId,
  nextContactRecordId,
  nextBankAccountRecordId,
  nextAddressId_,
  nextAddressAssignmentId_,
  nextContactAssignmentId_,
  nextTaxRegistrationId,
} from './counterpartyData';
import type {
  Counterparty,
  CounterpartyInput,
  Contact,
  ContactAssignment,
  BankAccount,
  Address,
  AddressAssignment,
  TaxRegistration,
} from '@features/tier1/counterparty/types';

const cpStore: Counterparty[] = [...counterpartySeed];
const contactPool: Contact[] = [...contactPoolSeed];
const contactAssignments: ContactAssignment[] = [...contactAssignmentSeed];
const bankAccountStore: BankAccount[] = [...bankAccountSeed];
const addressPool: Address[] = [...addressPoolSeed];
const addressAssignments: AddressAssignment[] = [...addressAssignmentSeed];
const taxRegistrationStore: TaxRegistration[] = [...taxRegistrationSeed];

const API = '/api/v1';

function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ type: 'about:blank', title, status, detail }, { status });
}

export const counterpartyHandlers = [

  // ── Counterparties ────────────────────────────────────────────────────────
  http.get(`${API}/counterparties`, () => HttpResponse.json(cpStore)),

  http.get(`${API}/counterparties/:id`, ({ params }) => {
    const cp = cpStore.find((c) => c.counterpartyId === Number(params.id));
    if (!cp) return problem(404, 'Not Found', `No counterparty with id ${params.id}.`);
    return HttpResponse.json(cp);
  }),

  http.post(`${API}/counterparties`, async ({ request }) => {
    const input = (await request.json()) as CounterpartyInput;
    if (cpStore.some((c) => c.cpCode.toUpperCase() === input.cpCode.toUpperCase())) {
      return problem(409, 'Conflict', `Counterparty Code "${input.cpCode}" already exists.`);
    }
    const now = new Date().toISOString();
    const cp: Counterparty = {
      ...input,
      counterpartyId: nextCounterpartyId(),
      isActive: true,
      deactivatedDate: null,
      createdAt: now,
      createdBy: 'mock-user',
      updatedAt: now,
      updatedBy: 'mock-user',
    };
    cpStore.push(cp);
    return HttpResponse.json(cp, { status: 201 });
  }),

  http.put(`${API}/counterparties/:id`, async ({ params, request }) => {
    const idx = cpStore.findIndex((c) => c.counterpartyId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `No counterparty with id ${params.id}.`);
    const input = (await request.json()) as CounterpartyInput;
    cpStore[idx] = { ...cpStore[idx], ...input, updatedAt: new Date().toISOString(), updatedBy: 'mock-user' };
    return HttpResponse.json(cpStore[idx]);
  }),

  http.patch(`${API}/counterparties/:id/deactivate`, ({ params }) => {
    const idx = cpStore.findIndex((c) => c.counterpartyId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `No counterparty with id ${params.id}.`);
    cpStore[idx] = { ...cpStore[idx], isActive: false, deactivatedDate: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString(), updatedBy: 'mock-user' };
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Address pool ──────────────────────────────────────────────────────────
  // GET /addresses   — global pool for "Link Existing" picker
  http.get(`${API}/addresses`, () => HttpResponse.json(addressPool)),

  http.post(`${API}/addresses`, async ({ request }) => {
    const body = (await request.json()) as Omit<Address, 'addressId' | '_localId'>;
    const record: Address = { ...body, addressId: nextAddressId_(), _localId: '' };
    addressPool.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),

  http.put(`${API}/addresses/:addressId`, async ({ params, request }) => {
    const idx = addressPool.findIndex((a) => a.addressId === Number(params.addressId));
    if (idx === -1) return problem(404, 'Not Found', 'Address not found.');
    const body = (await request.json()) as Omit<Address, 'addressId' | '_localId'>;
    addressPool[idx] = { ...addressPool[idx], ...body };
    return HttpResponse.json(addressPool[idx]);
  }),

  // ── Address assignments (entity_address link table) ───────────────────────
  // GET  /entity-addresses?entityType=COUNTERPARTY&entityId=1
  http.get(`${API}/entity-addresses`, ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const entityId = Number(url.searchParams.get('entityId'));
    return HttpResponse.json(
      addressAssignments.filter(
        (a) => a.entityType === entityType && a.entityId === entityId && a.isActive,
      ),
    );
  }),

  // POST /entity-addresses — create a new assignment (with optional new pool record)
  http.post(`${API}/entity-addresses`, async ({ request }) => {
    const body = (await request.json()) as {
      entityType: string;
      entityId: number;
      addressType: string;
      isPrimary: boolean;
      isLinked: boolean;
      // if !isLinked, full address data to create pool record
      addressId?: number;
      address?: Omit<Address, 'addressId' | '_localId'>;
    };

    let poolRecord: Address;
    if (body.isLinked && body.addressId != null) {
      const found = addressPool.find((a) => a.addressId === body.addressId);
      if (!found) return problem(404, 'Not Found', `Address ${body.addressId} not in pool.`);
      poolRecord = found;
    } else {
      // create a new pool record first
      poolRecord = { ...(body.address as Address), addressId: nextAddressId_(), _localId: '' };
      addressPool.push(poolRecord);
    }

    const assignment: AddressAssignment = {
      entityAddressId: nextAddressAssignmentId_(),
      _localId: '',
      entityType: body.entityType as AddressAssignment['entityType'],
      entityId: body.entityId,
      addressId: poolRecord.addressId,
      address: poolRecord,
      addressType: body.addressType,
      isPrimary: body.isPrimary,
      isActive: true,
      isLinked: body.isLinked,
    };
    addressAssignments.push(assignment);
    return HttpResponse.json(assignment, { status: 201 });
  }),

  http.put(`${API}/entity-addresses/:id`, async ({ params, request }) => {
    const idx = addressAssignments.findIndex((a) => a.entityAddressId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', 'Assignment not found.');
    const body = (await request.json()) as Partial<AddressAssignment>;

    // also update the pool record if the address data changed and not a link
    if (!addressAssignments[idx].isLinked && body.address) {
      const poolIdx = addressPool.findIndex((a) => a.addressId === addressAssignments[idx].addressId);
      if (poolIdx !== -1) addressPool[poolIdx] = { ...addressPool[poolIdx], ...body.address };
    }
    addressAssignments[idx] = { ...addressAssignments[idx], ...body };
    return HttpResponse.json(addressAssignments[idx]);
  }),

  http.patch(`${API}/entity-addresses/:id/deactivate`, ({ params }) => {
    const idx = addressAssignments.findIndex((a) => a.entityAddressId === Number(params.id));
    if (idx !== -1) addressAssignments[idx] = { ...addressAssignments[idx], isActive: false };
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Contact pool ──────────────────────────────────────────────────────────
  http.get(`${API}/contacts`, () => HttpResponse.json(contactPool)),

  http.post(`${API}/contacts`, async ({ request }) => {
    const body = (await request.json()) as Omit<Contact, 'contactId' | '_localId'>;
    const record: Contact = { ...body, contactId: nextContactRecordId(), _localId: '' };
    contactPool.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),

  http.put(`${API}/contacts/:contactId`, async ({ params, request }) => {
    const idx = contactPool.findIndex((c) => c.contactId === Number(params.contactId));
    if (idx === -1) return problem(404, 'Not Found', 'Contact not found.');
    const body = (await request.json()) as Omit<Contact, 'contactId' | '_localId'>;
    contactPool[idx] = { ...contactPool[idx], ...body };
    return HttpResponse.json(contactPool[idx]);
  }),

  // ── Contact assignments ───────────────────────────────────────────────────
  http.get(`${API}/entity-contacts`, ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const entityId = Number(url.searchParams.get('entityId'));
    return HttpResponse.json(
      contactAssignments.filter(
        (c) => c.entityType === entityType && c.entityId === entityId && c.isActive,
      ),
    );
  }),

  http.post(`${API}/entity-contacts`, async ({ request }) => {
    const body = (await request.json()) as {
      entityType: string;
      entityId: number;
      contactRole: string;
      isPrimary: boolean;
      isLinked: boolean;
      contactId?: number;
      contact?: Omit<Contact, 'contactId' | '_localId'>;
    };

    let poolRecord: Contact;
    if (body.isLinked && body.contactId != null) {
      const found = contactPool.find((c) => c.contactId === body.contactId);
      if (!found) return problem(404, 'Not Found', `Contact ${body.contactId} not in pool.`);
      poolRecord = found;
    } else {
      poolRecord = { ...(body.contact as Contact), contactId: nextContactRecordId(), _localId: '' };
      contactPool.push(poolRecord);
    }

    const assignment: ContactAssignment = {
      entityContactId: nextContactAssignmentId_(),
      _localId: '',
      entityType: body.entityType as ContactAssignment['entityType'],
      entityId: body.entityId,
      contactId: poolRecord.contactId,
      contact: poolRecord,
      contactRole: body.contactRole,
      isPrimary: body.isPrimary,
      isActive: true,
      isLinked: body.isLinked,
    };
    contactAssignments.push(assignment);
    return HttpResponse.json(assignment, { status: 201 });
  }),

  http.put(`${API}/entity-contacts/:id`, async ({ params, request }) => {
    const idx = contactAssignments.findIndex((c) => c.entityContactId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', 'Assignment not found.');
    const body = (await request.json()) as Partial<ContactAssignment>;
    if (!contactAssignments[idx].isLinked && body.contact) {
      const poolIdx = contactPool.findIndex((c) => c.contactId === contactAssignments[idx].contactId);
      if (poolIdx !== -1) contactPool[poolIdx] = { ...contactPool[poolIdx], ...body.contact };
    }
    contactAssignments[idx] = { ...contactAssignments[idx], ...body };
    return HttpResponse.json(contactAssignments[idx]);
  }),

  http.patch(`${API}/entity-contacts/:id/deactivate`, ({ params }) => {
    const idx = contactAssignments.findIndex((c) => c.entityContactId === Number(params.id));
    if (idx !== -1) contactAssignments[idx] = { ...contactAssignments[idx], isActive: false };
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Bank accounts (unchanged shape) ──────────────────────────────────────
  http.get(`${API}/counterparties/:id/bank-accounts`, ({ params }) =>
    HttpResponse.json(bankAccountStore.filter((b) => b.entityId === Number(params.id))),
  ),
  http.post(`${API}/counterparties/:id/bank-accounts`, async ({ params, request }) => {
    const body = (await request.json()) as Omit<BankAccount, 'bankAccountId' | '_localId'>;
    const record: BankAccount = { ...body, bankAccountId: nextBankAccountRecordId(), _localId: '', entityId: Number(params.id) };
    bankAccountStore.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),
  http.put(`${API}/counterparties/:id/bank-accounts/:bankAccountId`, async ({ params, request }) => {
    const idx = bankAccountStore.findIndex((b) => b.bankAccountId === Number(params.bankAccountId));
    if (idx === -1) return problem(404, 'Not Found', 'Bank account not found.');
    const body = (await request.json()) as Omit<BankAccount, 'bankAccountId' | '_localId'>;
    bankAccountStore[idx] = { ...bankAccountStore[idx], ...body };
    return HttpResponse.json(bankAccountStore[idx]);
  }),

  // ── Tax registrations (dbo.tax_registration) — polymorphic, no pool ───────
  http.get(`${API}/entity-tax-registrations`, ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const entityId = Number(url.searchParams.get('entityId'));
    return HttpResponse.json(
      taxRegistrationStore.filter(
        (t) => t.entityType === entityType && t.entityId === entityId && t.isActive,
      ),
    );
  }),
  http.post(`${API}/entity-tax-registrations`, async ({ request }) => {
    const body = (await request.json()) as Omit<TaxRegistration, 'taxRegId' | '_localId'>;
    const record: TaxRegistration = { ...body, taxRegId: nextTaxRegistrationId(), _localId: '' };
    taxRegistrationStore.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),
  http.put(`${API}/entity-tax-registrations/:id`, async ({ params, request }) => {
    const idx = taxRegistrationStore.findIndex((t) => t.taxRegId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', 'Tax registration not found.');
    const body = (await request.json()) as Partial<TaxRegistration>;
    taxRegistrationStore[idx] = { ...taxRegistrationStore[idx], ...body };
    return HttpResponse.json(taxRegistrationStore[idx]);
  }),
  http.patch(`${API}/entity-tax-registrations/:id/deactivate`, ({ params }) => {
    const idx = taxRegistrationStore.findIndex((t) => t.taxRegId === Number(params.id));
    if (idx !== -1) taxRegistrationStore[idx] = { ...taxRegistrationStore[idx], isActive: false };
    return new HttpResponse(null, { status: 204 });
  }),
];
