export const COMMODITY_TYPES = ['OIL', 'GAS', 'POWER', 'AGRICULTURAL', 'METALS'] as const;
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
