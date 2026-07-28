export interface TickerMapping {
  tickerMappingId: number;
  priceIndexId: number;
  priceIndexCode: string;
  priceIndexName: string;
  periodId: number | null;
  periodCode: string | null;
  priceSourceId: number;
  sourceCode: string;
  sourceName: string;
  settleTicker: string | null;
  openTicker: string | null;
  highTicker: string | null;
  lowTicker: string | null;
  avgTicker: string | null;
  promptTicker: string | null;
  bidTicker: string | null;
  askTicker: string | null;
  midTicker: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
}

export type TickerMappingInput = Omit<
  TickerMapping,
  'tickerMappingId' | 'priceIndexCode' | 'priceIndexName' | 'periodCode' | 'sourceCode' | 'sourceName'
>;

export interface TickerMappingAutoGenerateRequest {
  anchorTickerMappingId: number;
  count: number;
}
