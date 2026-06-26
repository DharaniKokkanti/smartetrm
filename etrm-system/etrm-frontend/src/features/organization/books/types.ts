import type { CommodityType } from '../desks/types';

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
  commodityType: CommodityType | null;
  baseCurrencyId: number;
  baseCurrencyCode: string;
  positionLimit: number | null;
  pnlLimit: number | null;
  varLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BookInput = Omit<Book,
  'bookId' | 'deskCode' | 'legalEntityCode' | 'legalEntityId' |
  'responsibleTraderName' | 'baseCurrencyCode' | 'createdAt' | 'updatedAt'>;
