export const VESSEL_TYPES = ['VLCC', 'SUEZMAX', 'AFRAMAX', 'PANAMAX', 'MR', 'HANDYSIZE', 'LNG_CARRIER', 'LPG_CARRIER', 'PRODUCT_TANKER', 'CHEMICAL_TANKER', 'BULK_CARRIER', 'BUNKER_VESSEL', 'FSRU', 'FPSO'] as const;
export type VesselType = (typeof VESSEL_TYPES)[number];

export const VESSEL_STATUS_CODES = ['ACTIVE', 'ON_CHARTER', 'IN_DRYDOCK', 'IDLE', 'SCRAPPED', 'BLACKLISTED'] as const;
export type VesselStatusCode = (typeof VESSEL_STATUS_CODES)[number];

export interface Vessel {
  vesselId: number;
  imoNumber: string;
  vesselName: string;
  vesselType: VesselType;
  dwt: number | null;
  grossTonnage: number | null;
  buildYear: number | null;
  flag: string;
  owner: string | null;
  operator: string | null;
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
  isActive: boolean;
  createdAt: string;
}

export type VesselInput = Omit<Vessel, 'vesselId' | 'createdAt'>;
