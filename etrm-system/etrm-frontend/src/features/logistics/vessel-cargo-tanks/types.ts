export const TANK_TYPES = ['CARGO_TANK', 'CARGO_HOLD'] as const;
export type TankType = (typeof TANK_TYPES)[number];

export interface VesselCargoTank {
  tankId: number;
  /** V132 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  vesselId: number;
  vesselName: string | null;
  tankCode: string;
  tankType: TankType;
  capacityCbm: number;
  coatingType: string | null;
  segregationGroup: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type VesselCargoTankInput = Omit<
  VesselCargoTank,
  'tankId' | 'vesselName' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
