import type { BookAccessGrant } from '@features/admin/bookaccess/types';

// Seed grants — mirrors systemUsersStore/legalEntityStore/desksStore/booksStore
// ids from etrmHandlers.ts. Mocks the new book_access_grant table (sibling to
// user_role_assignment, same PENDING_APPROVAL -> ACTIVE/REJECTED workflow).
export const bookAccessGrantsSeed: BookAccessGrant[] = [
  { grantId: 1, userId: 2, userFullName: 'John Doe', username: 'j.doe', scopeType: 'BOOK', scopeId: 1, scopeLabel: 'CRUDE-PROP — Crude Proprietary', accessLevel: 'READ_WRITE', status: 'ACTIVE', assignedBy: 'admin', assignedAt: '2026-01-15T10:00:00Z', approvedBy: 'admin', approvedAt: '2026-01-15T10:30:00Z', rejectionReason: null, validFrom: '2026-01-15', validTo: null, isActive: true },
  { grantId: 2, userId: 3, userFullName: 'Alice Smith', username: 'a.smith', scopeType: 'BOOK', scopeId: 2, scopeLabel: 'GAS-EU — European Gas (Desk)', accessLevel: 'READ_WRITE', status: 'ACTIVE', assignedBy: 'admin', assignedAt: '2026-01-15T10:00:00Z', approvedBy: 'admin', approvedAt: '2026-01-15T10:30:00Z', rejectionReason: null, validFrom: '2026-01-15', validTo: null, isActive: true },
  { grantId: 3, userId: 7, userFullName: 'Board Viewer', username: 'viewer1', scopeType: 'LEGAL_ENTITY', scopeId: 1, scopeLabel: 'ACME-UK — Acme Trading UK Limited', accessLevel: 'READ', status: 'ACTIVE', assignedBy: 'admin', assignedAt: '2026-01-15T10:00:00Z', approvedBy: 'admin', approvedAt: '2026-01-15T10:30:00Z', rejectionReason: null, validFrom: '2026-01-15', validTo: null, isActive: true },
  // Pending approval — worked example of the request/approve workflow
  { grantId: 4, userId: 4, userFullName: 'Risk Manager', username: 'risk.mgr', scopeType: 'BOOK', scopeId: 4, scopeLabel: 'LME-CU-ARB — Copper Arbitrage', accessLevel: 'READ', status: 'PENDING_APPROVAL', assignedBy: 'admin', assignedAt: '2026-06-25T09:00:00Z', approvedBy: null, approvedAt: null, rejectionReason: null, validFrom: '2026-06-25', validTo: null, isActive: true },
];

let nextGrantId = 5;
export function nextGrantId_() { return nextGrantId++; }

export const bookAccessGrantsStore: BookAccessGrant[] = [...bookAccessGrantsSeed];
