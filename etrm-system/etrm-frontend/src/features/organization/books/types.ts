export const BOOK_TYPES = ['TRADING', 'HEDGING', 'ARBITRAGE', 'PROP', 'CLIENT', 'RISK_MGMT'] as const;
export type BookType = (typeof BOOK_TYPES)[number];

export interface Book {
  bookId: number;
  bookCode: string;
  bookName: string;
  bookType: BookType;
  deskId: number;
  deskCode: string;
  legalEntityId: number;
  legalEntityCode: string;
  responsibleTraderId: number | null;
  responsibleTraderName: string | null;
  // FK to lookup_value(lookup_id), category='commodity_type' — see desks/types.ts COMMODITY_TYPE_LOOKUP.
  commodityType: number | null;
  currencyCode: string;
  positionLimit: number | null;
  pnlLimit: number | null;
  varLimit: number | null;
  goLiveDate: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// deskCode, legalEntityCode, responsibleTraderName are denormalized — not sent on save
export type BookInput = Omit<Book, 'bookId' | 'deskCode' | 'legalEntityCode' | 'responsibleTraderName' | 'createdAt' | 'updatedAt'>;
