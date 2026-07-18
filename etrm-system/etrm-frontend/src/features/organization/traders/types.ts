// FK to lookup_value(lookup_id), category='commodity_type' — see reference/commodity-types/types.ts COMMODITY_TYPE_LOOKUP.
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
  // FK to dbo.book(book_id), restricted to book_level_type=DESK rows (V123 —
  // renamed from deskId when dbo.desk was folded into dbo.book).
  bookId: number;
  bookCode: string;
  bookName: string;
  approverTraderId: number | null;
  approverName: string | null;
  commodityTypes: number[];
  commodityLimits: TraderCommodityLimit[];
  goLiveDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// fullName, email, legalEntityCode, bookCode, bookName, approverName are denormalized — not sent on save
export type TraderInput = Omit<Trader,
  'traderId' | 'fullName' | 'email' | 'legalEntityCode' | 'bookCode' | 'bookName' | 'approverName' | 'createdAt' | 'updatedAt'>;
