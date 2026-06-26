import { http, HttpResponse } from 'msw';
import {
  counterpartySeed,
  contactSeed,
  bankAccountSeed,
  addressSeed,
  nextCounterpartyId,
  nextContactRecordId,
  nextBankAccountRecordId,
  nextAddressRecordId,
} from './counterpartyData';
import type {
  Counterparty,
  CounterpartyInput,
  Contact,
  BankAccount,
  Address,
} from '@features/tier1/counterparty/types';

const cpStore: Counterparty[] = [...counterpartySeed];
const contactStore: Contact[] = [...contactSeed];
const bankAccountStore: BankAccount[] = [...bankAccountSeed];
const addressStore: Address[] = [...addressSeed];

const API = '/api/v1';

function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ type: 'about:blank', title, status, detail }, { status });
}

export const counterpartyHandlers = [
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
    cpStore[idx] = {
      ...cpStore[idx],
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: 'mock-user',
    };
    return HttpResponse.json(cpStore[idx]);
  }),

  http.patch(`${API}/counterparties/:id/deactivate`, ({ params }) => {
    const idx = cpStore.findIndex((c) => c.counterpartyId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `No counterparty with id ${params.id}.`);
    cpStore[idx] = {
      ...cpStore[idx],
      isActive: false,
      deactivatedDate: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
      updatedBy: 'mock-user',
    };
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Contacts ───────────────────────────────────────────────────────────
  http.get(`${API}/counterparties/:id/contacts`, ({ params }) =>
    HttpResponse.json(contactStore.filter((c) => c.entityId === Number(params.id))),
  ),
  http.post(`${API}/counterparties/:id/contacts`, async ({ params, request }) => {
    const body = (await request.json()) as Omit<Contact, 'contactId' | '_localId'>;
    const record: Contact = {
      ...body,
      contactId: nextContactRecordId(),
      _localId: '',
      entityId: Number(params.id),
    };
    contactStore.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),
  http.put(`${API}/counterparties/:id/contacts/:contactId`, async ({ params, request }) => {
    const idx = contactStore.findIndex((c) => c.contactId === Number(params.contactId));
    if (idx === -1) return problem(404, 'Not Found', 'Contact not found.');
    const body = (await request.json()) as Omit<Contact, 'contactId' | '_localId'>;
    contactStore[idx] = { ...contactStore[idx], ...body };
    return HttpResponse.json(contactStore[idx]);
  }),

  // ── Bank accounts ──────────────────────────────────────────────────────
  http.get(`${API}/counterparties/:id/bank-accounts`, ({ params }) =>
    HttpResponse.json(bankAccountStore.filter((b) => b.entityId === Number(params.id))),
  ),
  http.post(`${API}/counterparties/:id/bank-accounts`, async ({ params, request }) => {
    const body = (await request.json()) as Omit<BankAccount, 'bankAccountId' | '_localId'>;
    const record: BankAccount = {
      ...body,
      bankAccountId: nextBankAccountRecordId(),
      _localId: '',
      entityId: Number(params.id),
    };
    bankAccountStore.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),
  http.put(
    `${API}/counterparties/:id/bank-accounts/:bankAccountId`,
    async ({ params, request }) => {
      const idx = bankAccountStore.findIndex(
        (b) => b.bankAccountId === Number(params.bankAccountId),
      );
      if (idx === -1) return problem(404, 'Not Found', 'Bank account not found.');
      const body = (await request.json()) as Omit<BankAccount, 'bankAccountId' | '_localId'>;
      bankAccountStore[idx] = { ...bankAccountStore[idx], ...body };
      return HttpResponse.json(bankAccountStore[idx]);
    },
  ),

  // ── Addresses ──────────────────────────────────────────────────────────
  http.get(`${API}/counterparties/:id/addresses`, ({ params }) =>
    HttpResponse.json(addressStore.filter((a) => a.entityId === Number(params.id))),
  ),
  http.post(`${API}/counterparties/:id/addresses`, async ({ params, request }) => {
    const body = (await request.json()) as Omit<Address, 'addressId' | '_localId'>;
    const record: Address = {
      ...body,
      addressId: nextAddressRecordId(),
      _localId: '',
      entityId: Number(params.id),
    };
    addressStore.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),
  http.put(`${API}/counterparties/:id/addresses/:addressId`, async ({ params, request }) => {
    const idx = addressStore.findIndex((a) => a.addressId === Number(params.addressId));
    if (idx === -1) return problem(404, 'Not Found', 'Address not found.');
    const body = (await request.json()) as Omit<Address, 'addressId' | '_localId'>;
    addressStore[idx] = { ...addressStore[idx], ...body };
    return HttpResponse.json(addressStore[idx]);
  }),
];
