export const UOM_TYPES = ['VOLUME', 'WEIGHT', 'ENERGY', 'POWER', 'QUANTITY', 'DISTANCE'] as const;
export type UomType = (typeof UOM_TYPES)[number];
export interface Uom {
  uomId: number;
  uomCode: string;
  uomName: string;
  uomType: UomType;
  baseUomCode: string | null;
  conversionFactor: number | null;
  commodityHint: string | null;
  isActive: boolean;
  createdAt: string;
}
export type UomInput = Omit<Uom, 'uomId' | 'createdAt'>;
