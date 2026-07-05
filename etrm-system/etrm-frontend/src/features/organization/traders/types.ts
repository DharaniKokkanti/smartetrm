// FK to lookup_value(lookup_id), category='commodity_type' — see organization/desks/types.ts COMMODITY_TYPE_LOOKUP.
export interface TraderCommodityLimit {
  commodityType: number;
  dailyTradeLimit: number;
  singleTradeLimit: number;
  positionLimit: number;
}

export interface Trader {
  traderId: number;
  traderCode: string;
  userId: number;
  fullName: string;
  email: string;
  legalEntityId: number;
  legalEntityCode: string;
  deskId: number;
  deskCode: string;
  deskName: string;
  approverTraderId: number | null;
  approverName: string | null;
  commodityTypes: number[];
  commodityLimits: TraderCommodityLimit[];
  goLiveDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// fullName, email, legalEntityCode, deskCode, deskName, approverName are denormalized — not sent on save
export type TraderInput = Omit<Trader,
  'traderId' | 'fullName' | 'email' | 'legalEntityCode' | 'deskCode' | 'deskName' | 'approverName' | 'createdAt' | 'updatedAt'>;
