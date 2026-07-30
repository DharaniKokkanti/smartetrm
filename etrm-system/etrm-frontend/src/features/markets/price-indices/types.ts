export const PUBLICATION_SOURCES = ['PLATTS', 'ARGUS', 'ICE', 'LME', 'BLOOMBERG', 'REUTERS', 'NYMEX', 'EEX', 'ICIS', 'INTERNAL'] as const;
export type PublicationSource = (typeof PUBLICATION_SOURCES)[number];

export interface PriceIndex {
  priceIndexId: number;
  indexCode: string;
  indexName: string;
  currencyId: number;
  currencyCode: string;
  uomId: number;
  uomCode: string;
  publicationSource: PublicationSource;
  fixingTime: string | null;
  fixingTimezone: string | null;
  publishedPage: string | null;
  // V185 — primary/quick-pick listing for this index, for direct selection
  // in pricing formulas without a detour through price_index_source. An
  // index can still be sourced from other listings too (see
  // price_index_source, which stays the full sourcing map) — this is
  // nullable, not every index has (or needs) one yet.
  marketProductLinkId: number | null;
  marketCode: string | null;
  productCode: string | null;
  isActive: boolean;
  createdAt: string;
  /** Optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}

export type PriceIndexInput = Omit<PriceIndex, 'priceIndexId' | 'currencyCode' | 'uomCode' | 'marketCode' | 'productCode' | 'createdAt'>;
