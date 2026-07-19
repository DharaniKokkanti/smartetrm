export const VESSEL_CONDITIONS = ['LADEN', 'BALLAST'] as const;
export type VesselCondition = (typeof VESSEL_CONDITIONS)[number];

export interface VesselPerformanceCurve {
  curveId: number;
  /** V132 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  vesselId: number;
  vesselName: string | null;
  condition: VesselCondition;
  speedKnots: number;
  mainEngineConsumptionMtPerDay: number;
  auxEngineConsumptionMtPerDay: number | null;
  fuelGradeId: number | null;
  fuelGradeCode: string | null;
  effectiveFrom: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type VesselPerformanceCurveInput = Omit<
  VesselPerformanceCurve,
  'curveId' | 'vesselName' | 'fuelGradeCode' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
