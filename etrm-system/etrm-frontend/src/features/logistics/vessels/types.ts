export const VESSEL_TYPES = ['VLCC', 'SUEZMAX', 'AFRAMAX', 'PANAMAX', 'MR', 'HANDYSIZE', 'LNG_CARRIER', 'LPG_CARRIER', 'PRODUCT_TANKER', 'CHEMICAL_TANKER', 'BUNKER_VESSEL', 'FSRU', 'FPSO'] as const;
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
  isActive: boolean;
  createdAt: string;
}

export type VesselInput = Omit<Vessel, 'vesselId' | 'createdAt'>;
