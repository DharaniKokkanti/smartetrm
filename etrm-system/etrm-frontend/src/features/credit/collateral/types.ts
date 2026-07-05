export const COLLATERAL_DIRECTIONS = ['POSTED', 'RECEIVED'] as const;
export type CollateralDirection = (typeof COLLATERAL_DIRECTIONS)[number];

export const SECURED_ENTITY_TYPES = ['COUNTERPARTY', 'MARGIN_ACCOUNT', 'LC', 'OTHER'] as const;
export type SecuredEntityType = (typeof SECURED_ENTITY_TYPES)[number];

export const COLLATERAL_STATUSES = ['ACTIVE', 'RETURNED', 'CALLED', 'DEFAULTED', 'SUBSTITUTED'] as const;
export type CollateralStatus = (typeof COLLATERAL_STATUSES)[number];

export interface Collateral {
  collateralId: number;
  collateralTypeId: number;
  collateralTypeName: string;
  direction: CollateralDirection;
  securedEntityType: SecuredEntityType;
  securedEntityId: number;
  legalEntityId: number;
  legalEntityName: string;
  counterpartyId: number | null;
  counterpartyName: string | null;
  currencyId: number;
  currencyCode: string;
  faceValue: number;
  marketValue: number | null;
  haircutPct: number;
  instrumentIsin: string | null;
  instrumentDesc: string | null;
  lcId: number | null;
  bgId: number | null;
  postingDate: string;
  maturityDate: string | null;
  returnDate: string | null;
  status: CollateralStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CollateralInput = Omit<
  Collateral,
  'collateralId' | 'collateralTypeName' | 'legalEntityName' | 'counterpartyName' | 'currencyCode' | 'createdAt' | 'updatedAt'
>;
