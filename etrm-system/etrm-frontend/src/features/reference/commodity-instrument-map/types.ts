import type { CommodityTypeTrade } from '@features/trade/types';
import type { InstrumentType } from '@features/trade/types';

export interface CommodityInstrumentConfig {
  commodityType: CommodityTypeTrade;
  instrumentType: InstrumentType;
  sortOrder: number;
  isActive: boolean;
}

// Map shape returned by GET /commodity-instrument-map
export type CommodityInstrumentMap = Record<CommodityTypeTrade, InstrumentType[]>;
