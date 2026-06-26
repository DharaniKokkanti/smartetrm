import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';

export const PCG_DIRECTIONS = ['RECEIVED', 'ISSUED'] as const;
export type PcgDirection = (typeof PCG_DIRECTIONS)[number];

export const PCG_STATUSES = ['DRAFT', 'ISSUED', 'AMENDED', 'EXPIRED', 'CANCELLED', 'CALLED'] as const;
export type PcgStatus = (typeof PCG_STATUSES)[number];

/** Either a legal_entity or a counterparty can occupy any of the three
 *  roles — this is what makes the table work for both directions:
 *  RECEIVED (a counterparty's parent guarantees to us) and ISSUED (our own
 *  parent guarantees to a counterparty). */
export interface PcgParty {
  entityType: PolymorphicEntityType;
  entityId: number;
}

export interface ParentCompanyGuarantee {
  pcgId: number;
  pcgReference: string;
  direction: PcgDirection;
  guarantorEntityType: PolymorphicEntityType;
  guarantorEntityId: number;
  principalEntityType: PolymorphicEntityType;
  principalEntityId: number;
  beneficiaryEntityType: PolymorphicEntityType;
  beneficiaryEntityId: number;
  guaranteeAmount: number;
  currencyId: number;
  issueDate: string;
  expiryDate: string | null;
  isEvergreen: boolean;
  pcgStatus: PcgStatus;
  amountCalled: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type ParentCompanyGuaranteeInput = Omit<
  ParentCompanyGuarantee,
  'pcgId' | 'isActive' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;

/** Default role shape per direction — guides the form's defaults without
 *  hard-blocking the less common combinations (the DB only enforces that
 *  beneficiary type agrees with direction; everything else stays flexible
 *  for edge cases like cross-guarantees within a group). */
export function defaultPartyTypesFor(direction: PcgDirection): {
  guarantor: PolymorphicEntityType;
  principal: PolymorphicEntityType;
  beneficiary: PolymorphicEntityType;
} {
  return direction === 'RECEIVED'
    ? { guarantor: 'COUNTERPARTY', principal: 'COUNTERPARTY', beneficiary: 'LEGAL_ENTITY' }
    : { guarantor: 'LEGAL_ENTITY', principal: 'LEGAL_ENTITY', beneficiary: 'COUNTERPARTY' };
}
