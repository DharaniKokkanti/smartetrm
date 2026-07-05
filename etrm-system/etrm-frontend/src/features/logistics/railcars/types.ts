export const RAILCAR_TYPES = ['TANK_CAR', 'HOPPER_CAR', 'COVERED_HOPPER', 'FLATCAR', 'BOXCAR', 'OTHER'] as const;
export type RailcarType = (typeof RAILCAR_TYPES)[number];

export interface Railcar {
  railcarId: number;
  carNumber: string;
  carType: RailcarType;
  operatorId: number;
  operatorName: string;
  capacityLitres: number | null;
  capacityMt: number | null;
  dotClass: string | null;
  aarClass: string | null;
  approvedCommodities: string | null;
  lastTestDate: string | null;
  nextTestDate: string | null;
  certExpiry: string | null;
  homeRailroad: string | null;
  countryCode: string;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type RailcarInput = Omit<Railcar, 'railcarId' | 'operatorName' | 'createdAt'>;
