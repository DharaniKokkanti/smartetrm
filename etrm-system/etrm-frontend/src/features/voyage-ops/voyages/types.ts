export const VOYAGE_STATUSES = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
export type VoyageStatus = (typeof VOYAGE_STATUSES)[number];

export const LADEN_BALLAST_STATUSES = ['LADEN', 'BALLAST'] as const;
export type LadenBallastStatus = (typeof LADEN_BALLAST_STATUSES)[number];

export interface Voyage {
  voyageId: number;
  /** V132 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  voyageNumber: string;
  vesselId: number;
  vesselName: string | null;
  charterPartyId: number | null;
  cpReference: string | null;
  status: VoyageStatus;
  ladenBallastStatus: LadenBallastStatus | null;
  laycanStart: string | null;
  laycanEnd: string | null;
  loadLocationId: number | null;
  loadLocationName: string | null;
  dischargeLocationId: number | null;
  dischargeLocationName: string | null;
  eta: string | null;
  etd: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type VoyageInput = Omit<
  Voyage,
  'voyageId' | 'vesselName' | 'cpReference' | 'loadLocationName' | 'dischargeLocationName' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
