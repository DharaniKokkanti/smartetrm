import { http, HttpResponse } from 'msw';
import { guaranteeSeed, nextGuaranteeId } from './guaranteeData';
import type {
  ParentCompanyGuarantee,
  ParentCompanyGuaranteeInput,
} from '@features/tier1/guarantee/types';

const store: ParentCompanyGuarantee[] = [...guaranteeSeed];

const API = '/api/v1';

function problem(status: number, title: string, detail: string) {
  return HttpResponse.json({ type: 'about:blank', title, status, detail }, { status });
}

function appearsInAnyRole(
  g: ParentCompanyGuarantee,
  entityType: string,
  entityId: number,
): boolean {
  return (
    (g.guarantorEntityType === entityType && g.guarantorEntityId === entityId) ||
    (g.principalEntityType === entityType && g.principalEntityId === entityId) ||
    (g.beneficiaryEntityType === entityType && g.beneficiaryEntityId === entityId)
  );
}

export const guaranteeHandlers = [
  http.get(`${API}/parent-company-guarantees`, ({ request }) => {
    const url = new URL(request.url);
    const entityType = url.searchParams.get('entityType');
    const entityIdParam = url.searchParams.get('entityId');
    if (entityType && entityIdParam) {
      const entityId = Number(entityIdParam);
      return HttpResponse.json(store.filter((g) => appearsInAnyRole(g, entityType, entityId)));
    }
    return HttpResponse.json(store);
  }),

  http.post(`${API}/parent-company-guarantees`, async ({ request }) => {
    const input = (await request.json()) as ParentCompanyGuaranteeInput;
    if (store.some((g) => g.pcgReference.toUpperCase() === input.pcgReference.toUpperCase())) {
      return problem(409, 'Conflict', `PCG Reference "${input.pcgReference}" already exists.`);
    }
    const now = new Date().toISOString();
    const record: ParentCompanyGuarantee = {
      ...input,
      pcgId: nextGuaranteeId(),
      isActive: true,
      createdAt: now,
      createdBy: 'mock-user',
      updatedAt: now,
      updatedBy: 'mock-user',
    };
    store.push(record);
    return HttpResponse.json(record, { status: 201 });
  }),

  http.put(`${API}/parent-company-guarantees/:id`, async ({ params, request }) => {
    const idx = store.findIndex((g) => g.pcgId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `No guarantee with id ${params.id}.`);
    const input = (await request.json()) as ParentCompanyGuaranteeInput;
    store[idx] = {
      ...store[idx],
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: 'mock-user',
    };
    return HttpResponse.json(store[idx]);
  }),

  http.patch(`${API}/parent-company-guarantees/:id/deactivate`, ({ params }) => {
    const idx = store.findIndex((g) => g.pcgId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `No guarantee with id ${params.id}.`);
    store[idx] = {
      ...store[idx],
      isActive: false,
      updatedAt: new Date().toISOString(),
      updatedBy: 'mock-user',
    };
    return new HttpResponse(null, { status: 204 });
  }),
];
