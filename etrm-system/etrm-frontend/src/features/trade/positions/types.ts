import type { CommodityType } from '@features/organization/desks/types';

export type ConversionSource =
  | 'SAME_UOM'          // traded UoM is already the base UoM (MT or MWH)
  | 'DENSITY_ESTIMATE'  // BBL/CBM → MT using product.densityEstimateKgM3
  | 'GCV_GROSS'         // SCM/MMSCM → MWH using product.cvGrossMjScm
  | 'ENERGY_CONVERSION' // same-type energy unit (THERM/MMBTU/GJ → MWH via fixed ratio)
  | 'MANUAL';           // override entered by ops

export interface Position {
  positionId: number;
  positionType: 'COMMODITY' | 'FREIGHT';
  bookId: number;
  bookCode: string;
  bookName: string;
  productId: number;
  productCode: string;
  productName: string;
  commodityType: CommodityType;
  periodCode: string;
  /** Net quantity in traded UoM (positive = long, negative = short) */
  netQuantity: number;
  grossBuyQuantity: number;
  grossSellQuantity: number;
  quantityUomCode: string;
  /** Net quantity converted to base UoM (MT for physical; MWH for energy) */
  netQuantityBase: number | null;
  baseUomCode: string | null;
  conversionSource: ConversionSource | null;
  /** Weighted average entry price in currency per traded UoM */
  avgPrice: number | null;
  currencyCode: string;
  tradeCount: number;
  calculatedAt: string;
}
