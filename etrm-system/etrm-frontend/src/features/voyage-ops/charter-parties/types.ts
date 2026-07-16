export const CHARTER_DIRECTIONS = ['CHARTER_IN', 'CHARTER_OUT'] as const;
export type CharterDirection = (typeof CHARTER_DIRECTIONS)[number];

export const CHARTER_PARTY_STATUSES = ['ON_SUBS', 'FIXED', 'CANCELLED', 'COMPLETED'] as const;
export type CharterPartyStatus = (typeof CHARTER_PARTY_STATUSES)[number];

export const HIRE_PAYMENT_FREQUENCIES = ['MONTHLY', 'SEMI_MONTHLY', 'FIFTEEN_DAYS'] as const;
export type HirePaymentFrequency = (typeof HIRE_PAYMENT_FREQUENCIES)[number];

export const FREIGHT_RATE_BASES = ['PER_TONNE', 'LUMPSUM', 'PER_CBM', 'WORLDSCALE'] as const;
export type FreightRateBasis = (typeof FREIGHT_RATE_BASES)[number];

export const BUNKER_CLAUSE_BASES = ['SAME_QUANTITY_PCT', 'AS_ON_DELIVERY', 'FIXED_PRICE'] as const;
export type BunkerClauseBasis = (typeof BUNKER_CLAUSE_BASES)[number];

export interface CharterParty {
  charterPartyId: number;
  cpReference: string;
  charterPartyTypeId: number;
  charterPartyTypeCode: string | null;
  vesselId: number;
  vesselName: string | null;
  counterpartyId: number;
  counterpartyName: string | null;
  direction: CharterDirection;
  hireRate: number | null;
  hireCurrencyId: number | null;
  hireCurrencyCode: string | null;
  hirePaymentFrequency: HirePaymentFrequency | null;
  freightRate: number | null;
  freightRateBasis: FreightRateBasis | null;
  laytimeTermId: number | null;
  laytimeTermCode: string | null;
  demurrageRatePerDay: number | null;
  dispatchRatePerDay: number | null;
  deliveryLocationId: number | null;
  deliveryLocationName: string | null;
  redeliveryLocationId: number | null;
  redeliveryLocationName: string | null;
  deliveryDate: string | null;
  redeliveryDateEstimate: string | null;
  bunkerClauseBasis: BunkerClauseBasis | null;
  bunkerClauseTolerancePct: number | null;
  optionPeriodMonths: number | null;
  status: CharterPartyStatus;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type CharterPartyInput = Omit<
  CharterParty,
  | 'charterPartyId'
  | 'charterPartyTypeCode'
  | 'vesselName'
  | 'counterpartyName'
  | 'hireCurrencyCode'
  | 'laytimeTermCode'
  | 'deliveryLocationName'
  | 'redeliveryLocationName'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy'
>;

export const OFF_HIRE_REASON_TYPES = ['BREAKDOWN', 'DRY_DOCKING', 'DEVIATION', 'AWAITING_ORDERS', 'CREW_ISSUE', 'INSPECTION', 'OTHER'] as const;

export interface CharterOffHireEvent {
  offHireEventId: number;
  charterPartyId: number;
  offHireReasonTypeId: number;
  reasonCode: string | null;
  fromTs: string;
  toTs: string | null;
  hours: number | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type CharterOffHireEventInput = Omit<
  CharterOffHireEvent,
  'offHireEventId' | 'reasonCode' | 'hours' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
