// Master data commodity classification for desks, books, GL accounts, trader limits.
// Superset of tradeable commodities (trade/types.ts COMMODITY_TYPES_TRADE) plus MULTI/OTHER.
export const COMMODITY_TYPES = ['OIL', 'GAS', 'POWER', 'LNG', 'AGRICULTURAL', 'METALS', 'FREIGHT', 'RINS', 'ENVIRONMENTAL', 'MULTI', 'OTHER'] as const;
export type CommodityType = (typeof COMMODITY_TYPES)[number];

export interface Desk {
  deskId: number;
  deskCode: string;
  deskName: string;
  legalEntityId: number;
  legalEntityCode: string;
  commodityType: CommodityType | null;
  headTraderId: number | null;
  headTraderName: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type DeskInput = Omit<Desk, 'deskId' | 'legalEntityCode' | 'headTraderName' | 'createdAt' | 'updatedAt'>;
