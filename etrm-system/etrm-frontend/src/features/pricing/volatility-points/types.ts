export interface VolatilityPoint {
  volatilityPointId: number;
  optionIndexLinkId: number;
  optionIndexCode: string;
  periodId: number;
  periodCode: string;
  moneynessLabel: string;
  strikePrice: number | null;
  quoteDate: string;
  impliedVolatility: number;
  priceSourceId: number;
  sourceCode: string;
  isConfirmed: boolean;
  notes: string | null;
}

export type VolatilityPointInput = Omit<
  VolatilityPoint,
  'volatilityPointId' | 'optionIndexCode' | 'periodCode' | 'sourceCode' | 'isConfirmed'
>;
