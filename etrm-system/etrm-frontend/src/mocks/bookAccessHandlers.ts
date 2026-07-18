import { http, HttpResponse } from 'msw';
import { bookAccessGrantsStore, nextGrantId_ } from './bookAccessData';
import { systemUsersStore, desksStore, booksStore } from './etrmHandlers';
import { legalEntityStore } from './handlers';
import type { BookAccessGrant, BookAccessScopeType } from '@features/admin/bookaccess/types';

const API = '/api/v1';
const grants = bookAccessGrantsStore;

function problem(s: number, t: string, d: string) {
  return HttpResponse.json({ type: 'about:blank', title: t, status: s, detail: d }, { status: s });
}

function resolveScopeLabel(scopeType: BookAccessScopeType, scopeId: number): string | null {
  if (scopeType === 'LEGAL_ENTITY') {
    const e = legalEntityStore.find((r) => r.legalEntityId === scopeId);
    return e ? `${e.entityCode} — ${e.entityName}` : null;
  }
  if (scopeType === 'DESK') {
    const d = (desksStore as Array<Record<string, unknown>>).find((r) => r['deskId'] === scopeId);
    return d ? `${d['deskCode']} — ${d['deskName']}` : null;
  }
  const b = (booksStore as Array<Record<string, unknown>>).find((r) => r['bookId'] === scopeId);
  return b ? `${b['bookCode']} — ${b['bookName']}` : null;
}

export const bookAccessHandlers = [
  http.get(`${API}/book-access-grants`, () => HttpResponse.json(grants)),

  http.get(`${API}/users/:userId/book-access-grants`, ({ params }) =>
    HttpResponse.json(grants.filter((g) => g.userId === Number(params.userId) && g.isActive))),

  http.post(`${API}/users/:userId/book-access-grants`, async ({ params, request }) => {
    const body = (await request.json()) as { scopeType: BookAccessScopeType; scopeId: number; accessLevel: 'READ' | 'READ_WRITE' };
    const user = (systemUsersStore as Array<Record<string, unknown>>).find((u) => u['userId'] === Number(params.userId));
    if (!user) return problem(404, 'Not Found', `User ${String(params.userId)} not found.`);
    const scopeLabel = resolveScopeLabel(body.scopeType, body.scopeId);
    if (scopeLabel === null) return problem(404, 'Not Found', `${body.scopeType} ${body.scopeId} not found.`);
    const grant: BookAccessGrant = {
      grantId: nextGrantId_(),
      userId: Number(params.userId),
      userFullName: user['fullName'] as string,
      username: user['username'] as string,
      scopeType: body.scopeType,
      scopeId: body.scopeId,
      scopeLabel,
      accessLevel: body.accessLevel,
      status: 'PENDING_APPROVAL',
      assignedBy: 'mock-user',
      assignedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: null,
      isActive: true,
    };
    grants.push(grant);
    return HttpResponse.json(grant, { status: 201 });
  }),

  http.patch(`${API}/book-access-grants/:id/approve`, ({ params }) => {
    const idx = grants.findIndex((g) => g.grantId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', 'Grant not found.');
    grants[idx] = { ...grants[idx], status: 'ACTIVE', approvedBy: 'mock-manager', approvedAt: new Date().toISOString() };
    return HttpResponse.json(grants[idx]);
  }),

  http.patch(`${API}/book-access-grants/:id/reject`, async ({ params, request }) => {
    const idx = grants.findIndex((g) => g.grantId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', 'Grant not found.');
    const { reason } = (await request.json()) as { reason: string };
    grants[idx] = { ...grants[idx], status: 'REJECTED', rejectionReason: reason ?? null };
    return HttpResponse.json(grants[idx]);
  }),

  http.delete(`${API}/users/:userId/book-access-grants/:grantId`, ({ params }) => {
    const idx = grants.findIndex((g) => g.grantId === Number(params.grantId));
    if (idx !== -1) grants[idx] = { ...grants[idx], isActive: false, status: 'EXPIRED' };
    return new HttpResponse(null, { status: 204 });
  }),
];
