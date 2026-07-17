export interface Uom {
  uomId: number;
  uomCode: string;
  uomName: string;
  uomTypeId: number;
  uomTypeCode: string;
  baseUomCode: string | null;
  conversionFactor: number | null;
  /** FK to dbo.commodity (the 5-value broad classification); null = cross-commodity (applies to all), matching dbo.unit_of_measure.commodity_type's "NULL = cross-commodity" convention. */
  commodityTypeId: number | null;
  commodityTypeCode: string | null;
  isActive: boolean;
  createdAt: string;
}
export type UomInput = Omit<Uom, 'uomId' | 'uomTypeCode' | 'commodityTypeCode' | 'createdAt'>;
