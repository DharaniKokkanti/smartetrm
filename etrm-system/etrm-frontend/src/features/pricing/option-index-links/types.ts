export const PRICING_MODELS = ['BLACK_76', 'GARMAN_KOHLHAGEN', 'SABR', 'BACHELIER', 'SHIFTED_LOGNORMAL'] as const;
export type PricingModel = (typeof PRICING_MODELS)[number];

export interface OptionIndexLink {
  optionIndexLinkId: number;
  optionPriceIndexId: number;
  optionIndexCode: string;
  optionIndexName: string;
  underlyingPriceIndexId: number;
  underlyingIndexCode: string;
  underlyingIndexName: string;
  pricingModel: PricingModel;
  isActive: boolean;
  notes: string | null;
}

export type OptionIndexLinkInput = Omit<
  OptionIndexLink,
  'optionIndexLinkId' | 'optionIndexCode' | 'optionIndexName' | 'underlyingIndexCode' | 'underlyingIndexName'
>;
