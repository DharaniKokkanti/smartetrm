import { http, HttpResponse } from 'msw';
import { legalEntitySeed, nextLegalEntityId } from './data';
import type { LegalEntity, LegalEntityInput } from '@features/tier1/legal-entity/types';

// In-memory store, mutated across requests for the lifetime of the dev
// session — resets on full page reload. This is a mock, not a database.
// Exported so other mock handlers (e.g. GL accounts) can denormalize against
// the same canonical legal entities the real CRUD UI shows and edits —
// there's also a separate, older `legalEntitiesRef` shadow list in
// etrmHandlers.ts used internally by desk/book/trader seed data, which is
// NOT this table and must not be confused with it.
export const legalEntityStore: LegalEntity[] = [...legalEntitySeed];
const store = legalEntityStore;

const API = '/api/v1';

function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ type: 'about:blank', title, status, detail }, { status });
}

export const legalEntityHandlers = [
  http.get(`${API}/legal-entities`, () => {
    return HttpResponse.json(store);
  }),

  http.get(`${API}/legal-entities/:id`, ({ params }) => {
    const entity = store.find((e) => e.legalEntityId === Number(params.id));
    if (!entity) return problem(404, 'Not Found', `No legal entity with id ${params.id}.`);
    return HttpResponse.json(entity);
  }),

  http.post(`${API}/legal-entities`, async ({ request }) => {
    const input = (await request.json()) as LegalEntityInput;
    if (store.some((e) => e.entityCode.toUpperCase() === input.entityCode.toUpperCase())) {
      return problem(409, 'Conflict', `Entity Code "${input.entityCode}" already exists.`);
    }
    const now = new Date().toISOString();
    const entity: LegalEntity = {
      ...input,
      legalEntityId: nextLegalEntityId(),
      isActive: true,
      deactivatedDate: null,
      createdAt: now,
      createdBy: 'mock-user',
      updatedAt: now,
      updatedBy: 'mock-user',
    };
    store.push(entity);
    return HttpResponse.json(entity, { status: 201 });
  }),

  http.put(`${API}/legal-entities/:id`, async ({ params, request }) => {
    const idx = store.findIndex((e) => e.legalEntityId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `No legal entity with id ${params.id}.`);
    const input = (await request.json()) as LegalEntityInput;
    store[idx] = {
      ...store[idx],
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: 'mock-user',
    };
    return HttpResponse.json(store[idx]);
  }),

  http.patch(`${API}/legal-entities/:id/deactivate`, ({ params }) => {
    const idx = store.findIndex((e) => e.legalEntityId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `No legal entity with id ${params.id}.`);
    store[idx] = {
      ...store[idx],
      isActive: false,
      deactivatedDate: new Date().toISOString().slice(0, 10),
      updatedAt: new Date().toISOString(),
      updatedBy: 'mock-user',
    };
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/legal-entities/bulk`, async ({ request }) => {
    const body = (await request.json()) as { entities: LegalEntityInput[] };
    const created: LegalEntity[] = [];
    const rejected: { row: LegalEntityInput; reason: string }[] = [];
    const now = new Date().toISOString();

    for (const input of body.entities) {
      if (store.some((e) => e.entityCode.toUpperCase() === input.entityCode.toUpperCase())) {
        rejected.push({ row: input, reason: `Entity Code "${input.entityCode}" already exists.` });
        continue;
      }
      const entity: LegalEntity = {
        ...input,
        legalEntityId: nextLegalEntityId(),
        isActive: true,
        deactivatedDate: null,
        createdAt: now,
        createdBy: 'mock-user',
        updatedAt: now,
        updatedBy: 'mock-user',
      };
      store.push(entity);
      created.push(entity);
    }

    return HttpResponse.json({ created, rejected });
  }),
];
