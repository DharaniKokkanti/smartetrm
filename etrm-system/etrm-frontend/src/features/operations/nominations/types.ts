export const NOMINATION_TYPES = ['PIPELINE', 'VESSEL', 'TERMINAL', 'RAIL', 'TRUCK', 'STORAGE'] as const;
export type NominationType = (typeof NOMINATION_TYPES)[number];

export const NOMINATION_STATUSES = [
  'DRAFT', 'SUBMITTED', 'ACCEPTED', 'REJECTED', 'AMENDED', 'CANCELLED', 'COMPLETED',
] as const;
export type NominationStatus = (typeof NOMINATION_STATUSES)[number];

export interface Nomination {
  nominationId: number;
  orderId: number;
  orderReference: string | null;
  nominationReference: string;
  nominationType: NominationType;
  status: NominationStatus;
  nominatedQuantity: number;
  uomId: number;
  uomCode: string | null;   // denormalized display code, e.g. BBL
  nominationWindowStart: string;
  nominationWindowEnd: string;
  deadlineDatetime: string | null;
  locationId: number | null;
  locationName: string | null;
  pipelineCode: string | null;
  pipelineName: string | null;
  vesselId: number | null;
  vesselName: string | null;
  counterpartyId: number | null;
  counterpartyName: string | null;
  submittedByUserId: number | null;
  submittedByUserName: string | null;
  submittedAt: string | null;
  acceptedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NominationInput = Omit<
  Nomination,
  | 'nominationId' | 'orderReference' | 'locationName' | 'pipelineName'
  | 'vesselName' | 'counterpartyName' | 'submittedByUserName' | 'uomCode' | 'createdAt' | 'updatedAt'
>;

/** Lightweight order picker option — trade order legs across all trades. */
export interface TradeOrderOption {
  orderId: number;
  orderReference: string;
}
