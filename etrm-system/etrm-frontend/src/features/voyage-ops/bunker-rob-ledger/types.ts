export const ROB_EVENT_TYPES = ['STEM', 'CONSUMPTION', 'TRANSFER'] as const;
export type RobEventType = (typeof ROB_EVENT_TYPES)[number];

export const VOYAGE_LEGS = ['LADEN', 'BALLAST'] as const;
export type VoyageLeg = (typeof VOYAGE_LEGS)[number];

export const ENGINE_TYPES = ['MAIN', 'AUXILIARY', 'BOILER'] as const;
export type EngineType = (typeof ENGINE_TYPES)[number];

export interface VesselBunkerRobLedgerEntry {
  robLedgerId: number;
  vesselId: number;
  vesselName: string | null;
  fuelGradeId: number;
  fuelGradeCode: string | null;
  eventType: RobEventType;
  eventTime: string;
  quantityChangeMt: number;
  robAfterMt: number;
  voyageId: number | null;
  voyageLeg: VoyageLeg | null;
  engineType: EngineType | null;
  sourceBunkerStemId: number | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
}
