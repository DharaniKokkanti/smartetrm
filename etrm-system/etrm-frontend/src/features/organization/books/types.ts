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

export interface BookTraderView {
  traderId: number;
  traderName: string;
  role: 'PRIMARY' | 'SECONDARY' | 'BACKUP';
  isActive: boolean;
}

// TRADING = direct trade bookings land here. CONSOLIDATION = pure rollup node
// (P&L/risk aggregation only — see parentBookId); the application layer
// should reject direct trade bookings against a CONSOLIDATION book.
export type BookRole = 'TRADING' | 'CONSOLIDATION';
export const BOOK_ROLE_OPTIONS: { label: string; value: BookRole }[] = [
  { label: 'Trading', value: 'TRADING' },
  { label: 'Consolidation (rollup only)', value: 'CONSOLIDATION' },
];

// dbo.book_classification_dimension (V122) — the extensible axis list a book
// can carry a classification value on. Only COMMODITY is seeded today; add a
// new dimension by inserting a row in the DB, then a matching entry in
// DIMENSION_VALUE_OPTIONS below (no other schema/API change needed).
export interface BookClassificationDimension {
  dimensionId: number;
  dimensionCode: string;
  dimensionName: string;
  isMultiValued: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface BookClassificationView {
  bookClassificationId: number;
  dimensionCode: string;
  dimensionName: string;
  valueCode: string;
  valueLabel: string | null;
  isPrimary: boolean;
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
  parentBookId: number | null;
  parentBookCode: string | null; // denormalized
  bookRole: BookRole;
  baseCurrencyId: number; // FK -> dbo.currency(currency_id), NOT NULL default USD
  positionLimit: number | null;
  pnlLimit: number | null;
  varLimit: number | null;
  goLiveDate: string | null;
  description: string | null;
  isActive: boolean;
  archivedAt: string | null;
  archivedReason: string | null;
  // Denormalized, read-only — populated by the backend from book_trader.
  traders: BookTraderView[];
  // Denormalized, read-only — populated by the backend from book_classification (V122).
  classifications: BookClassificationView[];
  createdAt: string;
  updatedAt: string;
}

// deskCode, legalEntityCode, parentBookCode, traders, classifications are
// denormalized/read-only; archivedAt/archivedReason are only set via
// PATCH /books/{id}/archive — none of these are sent on create/update.
export type BookInput = Omit<Book,
  'bookId' | 'deskCode' | 'legalEntityCode' | 'parentBookCode' | 'traders' | 'classifications'
  | 'archivedAt' | 'archivedReason' | 'createdAt' | 'updatedAt'>;
