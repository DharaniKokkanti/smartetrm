import type { CommodityType } from '@features/reference/commodity-types/types';

export interface UomConversion {
  conversionId: number;
  fromUomCode: string;
  toUomCode: string;
  factor: number;
  commodityType: CommodityType | null;
  notes: string | null;
}

export type UomConversionInput = Omit<UomConversion, 'conversionId'>;
