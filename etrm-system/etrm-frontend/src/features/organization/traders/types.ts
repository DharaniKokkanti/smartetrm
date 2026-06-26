import type { CommodityType } from '../desks/types';

export interface TraderCommodityLimit {
  commodityType: CommodityType;
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
  deskId: number;
  deskCode: string;
  deskName: string;
  approverTraderId: number | null;
  approverName: string | null;
  commodityTypes: CommodityType[];
  commodityLimits: TraderCommodityLimit[];
  goLiveDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type TraderInput = Omit<Trader,
  'traderId' | 'fullName' | 'email' | 'deskCode' | 'deskName' | 'approverName' | 'createdAt' | 'updatedAt'>;
