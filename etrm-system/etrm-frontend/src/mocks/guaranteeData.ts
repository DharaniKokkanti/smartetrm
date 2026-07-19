import type { ParentCompanyGuarantee } from '@features/tier1/guarantee/types';

let nextPcgId = 3;

export const guaranteeSeed: ParentCompanyGuarantee[] = [
  {
    pcgId: 1,
    rowVersion: 0,
    pcgReference: 'PCG-2026-0001',
    direction: 'RECEIVED',
    guarantorEntityType: 'COUNTERPARTY',
    guarantorEntityId: 3, // Shell plc
    principalEntityType: 'COUNTERPARTY',
    principalEntityId: 1, // Shell Trading International Ltd
    beneficiaryEntityType: 'LEGAL_ENTITY',
    beneficiaryEntityId: 1, // Acme UK
    guaranteeAmount: 50000000,
    currencyId: 1, // USD
    issueDate: '2026-01-20',
    isEvergreen: false,
    expiryDate: '2027-01-20',
    pcgStatus: 'ISSUED',
    amountCalled: null,
    isActive: true,
    notes: "Backs Shell Trading International Ltd's credit limit with Acme UK.",
    createdAt: '2026-01-20T09:00:00Z',
    createdBy: 'SYSTEM',
    updatedAt: '2026-01-20T09:00:00Z',
    updatedBy: 'SYSTEM',
  },
  {
    pcgId: 2,
    rowVersion: 0,
    pcgReference: 'PCG-2026-0002',
    direction: 'ISSUED',
    guarantorEntityType: 'LEGAL_ENTITY',
    guarantorEntityId: 1, // Acme UK (the group's booking/parent entity in this mock)
    principalEntityType: 'LEGAL_ENTITY',
    principalEntityId: 2, // Acme US
    beneficiaryEntityType: 'COUNTERPARTY',
    beneficiaryEntityId: 2, // Glencore
    guaranteeAmount: 25000000,
    currencyId: 1, // USD
    issueDate: '2026-03-01',
    isEvergreen: true,
    expiryDate: null,
    pcgStatus: 'ISSUED',
    amountCalled: null,
    isActive: true,
    notes: "We guarantee Acme US's trading obligations to Glencore, evergreen until revoked.",
    createdAt: '2026-03-01T09:00:00Z',
    createdBy: 'SYSTEM',
    updatedAt: '2026-03-01T09:00:00Z',
    updatedBy: 'SYSTEM',
  },
];

export function nextGuaranteeId(): number {
  return nextPcgId++;
}
