export type NormalBalance = 'DEBIT' | 'CREDIT';

export interface GlAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  // FK to lookup_value(lookup_id), category='commodity_type' — see reference/commodity-types/types.ts COMMODITY_TYPE_LOOKUP.
  commodityType: number | null;
  /** FK to dbo.cost_center, which itself FKs to dbo.profit_center — the profit center is reached by joining through this, not stored directly here. */
  costCenterId: number | null;
  costCenterCode: string | null;
  /** FK to dbo.tax_code — the default tax code applied when posting to this account. */
  defaultTaxCodeId: number | null;
  defaultTaxCode: string | null;
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
  currencyId: number | null;
  /** Mapping code to the external ERP/GL system of record (SAP, Oracle, etc). */
  externalGlCode: string | null;
  /** Summary/rollup account that should not receive direct postings. */
  isControlAccount: boolean;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}
export type GlAccountInput = Omit<GlAccount, 'accountId' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy' | 'legalEntityCode' | 'bookCode' | 'parentAccountCode' | 'costCenterCode' | 'defaultTaxCode'>;
