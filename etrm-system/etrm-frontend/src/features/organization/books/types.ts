// FK to dbo.book_type(book_type_id) — a dedicated table (V17), NOT lookup_value.
// V55 briefly redirected book.book_type at lookup_value; V85 redirected it
// back onto dbo.book_type (see V85__lookup_category.sql's own comment:
// "book_type is the one exception among V17's 13 pairs"). Ids below mirror
// dbo.book_type's real seed order (database/consolidated seed, V17).
export interface BookTypeLookupRow { bookTypeId: number; code: string; label: string }
export const BOOK_TYPE_LOOKUP: BookTypeLookupRow[] = [
  { bookTypeId: 1, code: 'TRADING',   label: 'Trading' },
  { bookTypeId: 2, code: 'HEDGING',   label: 'Hedging' },
  { bookTypeId: 3, code: 'ARBITRAGE', label: 'Arbitrage' },
  { bookTypeId: 4, code: 'PROP',      label: 'Prop' },
  { bookTypeId: 5, code: 'CLIENT',    label: 'Client' },
  { bookTypeId: 6, code: 'RISK_MGMT', label: 'Risk Mgmt' },
];
export function bookTypeLabel(bookTypeId: number | null | undefined): string {
  if (bookTypeId == null) return '—';
  return BOOK_TYPE_LOOKUP.find((b) => b.bookTypeId === bookTypeId)?.label ?? `#${bookTypeId}`;
}

export interface Book {
  bookId: number;
  bookCode: string;
  bookName: string;
  // FK to dbo.book_type(book_type_id) — see BOOK_TYPE_LOOKUP above.
  bookType: number;
  deskId: number;
  deskCode: string;
  legalEntityId: number;
  legalEntityCode: string;
  responsibleTraderId: number | null;
  responsibleTraderName: string | null;
  // FK to dbo.commodity_type(commodity_type_id) — see desks/types.ts COMMODITY_TYPE_LOOKUP.
  commodityType: number | null;
  baseCurrencyId: number; // FK -> dbo.currency(currency_id), NOT NULL default USD
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
