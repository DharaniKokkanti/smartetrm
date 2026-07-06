import type { CommodityType } from '@features/organization/desks/types';

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
  /** Commodities this UoM is valid for; null/undefined = cross-commodity (applies to all), matching dbo.unit_of_measure.commodity_type's "NULL = cross-commodity" convention. */
  commodityTypes: CommodityType[] | null;
  isActive: boolean;
  createdAt: string;
}
export type UomInput = Omit<Uom, 'uomId' | 'createdAt'>;
