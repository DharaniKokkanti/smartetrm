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
  isActive: boolean;
  createdAt: string;
}

export type PriceIndexInput = Omit<PriceIndex, 'priceIndexId' | 'currencyCode' | 'uomCode' | 'createdAt'>;
