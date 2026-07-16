export interface LaytimeCalculation {
  laytimeCalculationId: number;
  voyageId: number;
  portLocationId: number;
  portLocationName: string | null;
  laytimeTermId: number | null;
  laytimeTermCode: string | null;
  allowedLaytimeHours: number | null;
  usedLaytimeHours: number | null;
  demurrageHours: number | null;
  despatchHours: number | null;
  demurrageAmount: number | null;
  despatchAmount: number | null;
  currencyId: number | null;
  currencyCode: string | null;
  versionNumber: number;
  isCurrentVersion: boolean;
  supersededByVersion: number | null;
  calculatedAt: string;
  notes: string | null;
  createdAt: string;
  createdBy: string;
}

// No update path — a recalculation always POSTs a new version (see the
// backend's LaytimeCalculationService.create versioning contract).
export type LaytimeCalculationInput = Pick<
  LaytimeCalculation,
  | 'voyageId'
  | 'portLocationId'
  | 'laytimeTermId'
  | 'allowedLaytimeHours'
  | 'usedLaytimeHours'
  | 'demurrageHours'
  | 'despatchHours'
  | 'demurrageAmount'
  | 'despatchAmount'
  | 'currencyId'
  | 'notes'
>;
