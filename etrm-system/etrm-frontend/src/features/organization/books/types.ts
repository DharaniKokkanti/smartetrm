import type { ConsolidationMethod, OwnerType } from '@components/smart/OwnershipPanel';

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

// FK to dbo.book_level_type(level_type_id) (V123) — what kind of hierarchy
// node this row is. Same no-dedicated-entity treatment as BOOK_TYPE_LOOKUP
// above (a fixed, rarely-changing set; ids mirror the real seed order).
// dbo.legal_entity is NOT part of this tree (it keeps its own table/hierarchy
// — see legalEntityId below), so DESK is the top level here.
export interface BookLevelTypeLookupRow { levelTypeId: number; code: string; label: string }
export const BOOK_LEVEL_TYPE_LOOKUP: BookLevelTypeLookupRow[] = [
  { levelTypeId: 1, code: 'DESK', label: 'Desk' },
  { levelTypeId: 2, code: 'STRATEGY', label: 'Strategy' },
  { levelTypeId: 3, code: 'TRADING_BOOK', label: 'Trading Book' },
];
export function bookLevelTypeLabel(levelTypeId: number | null | undefined): string {
  if (levelTypeId == null) return '—';
  return BOOK_LEVEL_TYPE_LOOKUP.find((l) => l.levelTypeId === levelTypeId)?.label ?? `#${levelTypeId}`;
}
export function bookLevelTypeCode(levelTypeId: number | null | undefined): string | null {
  if (levelTypeId == null) return null;
  return BOOK_LEVEL_TYPE_LOOKUP.find((l) => l.levelTypeId === levelTypeId)?.code ?? null;
}
export const DESK_LEVEL_TYPE_ID = 1;
export const TRADING_BOOK_LEVEL_TYPE_ID = 3;

export interface BookEodStatus {
  bookEodStatusId: number;
  bookId: number;
  businessDate: string;
  status: 'OPEN' | 'LOCKED' | 'REOPENED';
  lockedBy: string | null;
  lockedAt: string | null;
  reopenedBy: string | null;
  reopenedAt: string | null;
  reopenReason: string | null;
  createdAt: string;
}

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
  // FK to dbo.book_level_type(level_type_id) (V123) — see BOOK_LEVEL_TYPE_LOOKUP above.
  bookLevelTypeId: number;
  // Can this row hold direct trade/cost/assay postings? (V123, supersedes bookRole)
  isLeafNode: boolean;
  legalEntityId: number;
  legalEntityCode: string;
  parentBookId: number | null;
  parentBookCode: string | null; // denormalized
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

// legalEntityCode, parentBookCode, traders, classifications are
// denormalized/read-only; archivedAt/archivedReason are only set via
// PATCH /books/{id}/archive — none of these are sent on create/update.
export type BookInput = Omit<Book,
  'bookId' | 'legalEntityCode' | 'parentBookCode' | 'traders' | 'classifications'
  | 'archivedAt' | 'archivedReason' | 'createdAt' | 'updatedAt'>;

/**
 * Mirrors dbo.book_ownership (V126) — independent of the book's parent
 * legal_entity's own entity_type/ownership; any book can carry a split
 * (the Musket/Circle K-style case). Same shape as
 * legal-entity/types.ts's LegalEntityOwnership, sharing OwnerType/
 * ConsolidationMethod from the common OwnershipPanel component.
 */
export interface BookOwnership {
  bookOwnershipId: number;
  bookId: number;
  ownerType: OwnerType;
  ownerRefId: number | null;
  externalOwnerName: string | null;
  ownerDisplayName: string;
  ownershipPct: number;
  isOperator: boolean;
  consolidationMethod: ConsolidationMethod;
  effectiveFrom: string; // ISO date
  effectiveTo: string | null; // ISO date
  isActive: boolean;
  notes: string | null;
}

/** Shape sent on add — server assigns id/bookId/ownerDisplayName/isActive. */
export type BookOwnershipInput = Omit<
  BookOwnership,
  'bookOwnershipId' | 'bookId' | 'ownerDisplayName' | 'isActive'
>;

export interface BookOwnershipListView {
  rows: BookOwnership[];
  totalActiveOwnershipPct: number;
}
