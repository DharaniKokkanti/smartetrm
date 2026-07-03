export const PRICING_TYPES = ['FIXED', 'FLOATING', 'FORMULA', 'DIFFERENTIAL', 'AVERAGE', 'OPTION_STRIKE', 'TAS', 'PLATTS_WINDOW', 'BALMO'] as const;
export type PricingType = (typeof PRICING_TYPES)[number];

export const AVERAGING_METHODS = ['ARITHMETIC', 'WEIGHTED', 'ASIAN'] as const;
export type AveragingMethod = (typeof AVERAGING_METHODS)[number];

export const ROUNDING_RULES = ['NONE', 'ROUND_2DP', 'ROUND_3DP', 'ROUND_4DP', 'ROUND_UP', 'ROUND_DOWN'] as const;
export type RoundingRule = (typeof ROUNDING_RULES)[number];

export const TAS_EXCHANGES = ['CME_NYMEX', 'ICE_EUROPE', 'ICE_US'] as const;
export type TasExchangeRule = (typeof TAS_EXCHANGES)[number];

export const TAS_CONTRACT_SERIES = ['CL', 'NG', 'HO', 'RB', 'BZ', 'GAS_OIL', 'OTHER'] as const;
export type TasContractSeries = (typeof TAS_CONTRACT_SERIES)[number];

export const BALMO_EXCHANGES = ['CME_NYMEX', 'ICE_EUROPE', 'ICE_US'] as const;
export type BalmoExchange = (typeof BALMO_EXCHANGES)[number];

export const BALMO_CONTRACT_SERIES = ['CL', 'NG', 'HO', 'RB', 'BZ', 'GAS_OIL', 'HH', 'OTHER'] as const;
export type BalmoContractSeries = (typeof BALMO_CONTRACT_SERIES)[number];

export interface PricingRule {
  pricingRuleId: number;
  ruleCode: string;
  ruleName: string;
  pricingType: PricingType;
  priceIndexCode: string | null;
  differentialAmount: number | null;
  differentialCurrencyCode: string | null;
  differentialUomCode: string | null;
  formulaExpression: string | null;
  averagingMethod: AveragingMethod | null;
  pricingCalendarCode: string | null;
  publicationSource: string | null;
  rounding: RoundingRule;
  // TAS-specific fields — only populated when pricingType === 'TAS'
  tasExchange: TasExchangeRule | null;
  tasContractSeries: TasContractSeries | null;
  tasTickSize: number | null;   // USD per tick per unit (CL: 0.01, NG: 0.001, HO: 0.0001)
  // BALMO-specific fields — only populated when pricingType === 'BALMO'
  balmoExchange: BalmoExchange | null;
  balmoSeries: BalmoContractSeries | null;
  balmoTickSize: number | null;
  isActive: boolean;
  createdAt: string;
}

export type PricingRuleInput = Omit<PricingRule, 'pricingRuleId' | 'createdAt'>;
