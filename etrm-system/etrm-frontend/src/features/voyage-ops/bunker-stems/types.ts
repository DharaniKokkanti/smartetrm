export const BUNKER_STEM_STATUSES = ['NOMINATED', 'CONFIRMED', 'DELIVERED', 'DISPUTED'] as const;
export type BunkerStemStatus = (typeof BUNKER_STEM_STATUSES)[number];

export interface BunkerStem {
  bunkerStemId: number;
  voyageId: number | null;
  vesselId: number;
  vesselName: string | null;
  fuelGradeId: number;
  fuelGradeCode: string | null;
  quantityMt: number;
  pricePerMt: number | null;
  currencyId: number | null;
  currencyCode: string | null;
  supplierCounterpartyId: number | null;
  supplierName: string | null;
  portLocationId: number | null;
  portLocationName: string | null;
  robBeforeMt: number | null;
  robAfterMt: number | null;
  status: BunkerStemStatus;
  stemDate: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type BunkerStemInput = Omit<
  BunkerStem,
  | 'bunkerStemId'
  | 'vesselName'
  | 'fuelGradeCode'
  | 'currencyCode'
  | 'supplierName'
  | 'portLocationName'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy'
>;
