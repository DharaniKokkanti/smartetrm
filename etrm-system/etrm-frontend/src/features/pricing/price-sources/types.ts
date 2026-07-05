export const SOURCE_TYPES = ['EXCHANGE', 'VENDOR', 'BROKER', 'BLOOMBERG', 'REUTERS', 'INTERNAL', 'OTHER'] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const DELIVERY_METHODS = ['API', 'FTP', 'EMAIL', 'MANUAL', 'REAL_TIME_FEED'] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const FREQUENCIES = ['REAL_TIME', 'INTRADAY', 'EOD', 'WEEKLY', 'MANUAL'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const SOURCE_ROLES = ['PRIMARY_MTM', 'SETTLEMENT', 'BACKUP', 'REFERENCE'] as const;
export type SourceRole = (typeof SOURCE_ROLES)[number];

export interface PriceSource {
  priceSourceId: number;
  sourceCode: string;
  sourceName: string;
  sourceType: SourceType;
  deliveryMethod: DeliveryMethod;
  frequency: Frequency;
  timezone: string | null;
  baseUrl: string | null;
  credentialsRef: string | null;
  slaMinutes: number | null;
  isActive: boolean;
  createdAt: string;
}

export type PriceSourceInput = Omit<PriceSource, 'priceSourceId' | 'createdAt'>;

// Price Index → Source link
export interface PriceIndexSource {
  pisId: number;
  priceIndexId: number;
  priceIndexCode: string;
  priceIndexName: string;
  priceSourceId: number;
  sourceCode: string;
  sourceRole: SourceRole;
  sourceFieldCode: string | null;
  sourceTicker: string | null;
  priceMultiplier: number;
  priceOffset: number;
  calculationSequence: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

export type PriceIndexSourceInput = Omit<PriceIndexSource, 'pisId' | 'priceIndexCode' | 'priceIndexName' | 'sourceCode'>;
