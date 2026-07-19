export const TANK_TYPES = [
  'FIXED_ROOF', 'FLOATING_ROOF', 'INTERNAL_FLOAT', 'PRESSURE_SPHERE',
  'CRYOGENIC', 'UNDERGROUND', 'OPEN_TOP', 'SILO', 'OTHER',
] as const;
export type TankType = (typeof TANK_TYPES)[number];

export const TANK_STATUSES = ['IN_SERVICE', 'MAINTENANCE', 'CLEANING', 'INSPECTION', 'MOTHBALLED', 'DECOMMISSIONED'] as const;
export type TankStatus = (typeof TANK_STATUSES)[number];

export interface Tank {
  tankId: number;
  /** V130 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  facilityId: number;
  facilityName: string;
  tankNumber: string;
  tankName: string | null;
  tankType: TankType;
  commodityType: string;
  primaryProductId: number | null;
  primaryProductName: string | null;
  nominalCapacityM3: number | null;
  workingCapacityM3: number | null;
  heelVolumeM3: number | null;
  diameterM: number | null;
  heightM: number | null;
  isHeated: boolean;
  maxTempCelsius: number | null;
  hasMetering: boolean;
  meterRef: string | null;
  tankStatus: TankStatus;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type TankInput = Omit<Tank, 'tankId' | 'facilityName' | 'primaryProductName' | 'createdAt' | 'updatedAt'>;
