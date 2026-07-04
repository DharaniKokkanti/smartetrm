import type { CommodityType } from '@features/organization/desks/types';

export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface GlAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  commodityType: CommodityType | null;
  costCenter: string | null;
  description: string | null;
  /** Booking company this account belongs to — null = shared/corporate account applying across all entities. */
  legalEntityId: number | null;
  legalEntityCode: string | null;
  /** Trading book (portfolio) this account is scoped to for P&L attribution — null = not book-specific. */
  bookId: number | null;
  bookCode: string | null;
  /** Parent account in the chart-of-accounts hierarchy, for rollups — null = top level. */
  parentAccountId: number | null;
  parentAccountCode: string | null;
  normalBalance: NormalBalance;
  /** Null = follows the booking entity's base currency rather than a fixed one. */
  currencyCode: string | null;
  /** Mapping code to the external ERP/GL system of record (SAP, Oracle, etc). */
  externalGlCode: string | null;
  /** Summary/rollup account that should not receive direct postings. */
  isControlAccount: boolean;
  isActive: boolean;
  createdAt: string;
}
export type GlAccountInput = Omit<GlAccount, 'accountId' | 'createdAt' | 'legalEntityCode' | 'bookCode' | 'parentAccountCode'>;
