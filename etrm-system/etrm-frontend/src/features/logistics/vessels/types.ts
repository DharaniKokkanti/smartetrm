export const VESSEL_STATUS_CODES = ['ACTIVE', 'ON_CHARTER', 'IN_DRYDOCK', 'IDLE', 'SCRAPPED', 'BLACKLISTED'] as const;
export type VesselStatusCode = (typeof VESSEL_STATUS_CODES)[number];

export interface Vessel {
  vesselId: number;
  /** V132 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  imoNumber: string;
  vesselName: string;
  vesselTypeId: number;
  vesselTypeCode: string;
  dwt: number | null;
  grossTonnage: number | null;
  buildYear: number | null;
  flagCountryId: number;
  buildCountryId: number | null;
  ownerOperatorId: number | null;
  ownerOperatorName: string | null;
  managerOperatorId: number | null;
  managerOperatorName: string | null;
  classificationSociety: string | null;
  vettingExpiry: string | null;
  sireInspectionDate: string | null;
  cdiBerthStatus: string | null;
  statusCode: VesselStatusCode;
  // Dry-bulk (metals/agri) stowage capacity — grain is for free-flowing cargo,
  // bale for packed cargo; bale is always <= grain. Only relevant for BULK_CARRIER.
  grainCapacityCbm: number | null;
  baleCapacityCbm: number | null;
  // LNG-specific: contractually guaranteed max daily boil-off (%/day) and the
  // minimum LNG heel volume retained between voyages to keep tanks cold.
  guaranteedBoilOffRatePctPerDay: number | null;
  heelCapacityCbm: number | null;
  fleetId: number | null;
  fleetName: string | null;
  isActive: boolean;
  createdAt: string;
}

export type VesselInput = Omit<Vessel, 'vesselId' | 'vesselTypeCode' | 'ownerOperatorName' | 'managerOperatorName' | 'fleetName' | 'createdAt'>;
