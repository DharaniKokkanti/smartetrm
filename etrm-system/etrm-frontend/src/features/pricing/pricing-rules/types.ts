export const PRICING_TYPES = ['FIXED', 'FLOATING', 'FORMULA', 'DIFFERENTIAL', 'AVERAGE', 'OPTION_STRIKE', 'TAS', 'PLATTS_WINDOW'] as const;
export type PricingType = (typeof PRICING_TYPES)[number];

export const AVERAGING_METHODS = ['ARITHMETIC', 'WEIGHTED', 'ASIAN'] as const;
export type AveragingMethod = (typeof AVERAGING_METHODS)[number];

export const ROUNDING_RULES = ['NONE', 'ROUND_2DP', 'ROUND_3DP', 'ROUND_4DP', 'ROUND_UP', 'ROUND_DOWN'] as const;
export type RoundingRule = (typeof ROUNDING_RULES)[number];

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
  isActive: boolean;
  createdAt: string;
}

export type PricingRuleInput = Omit<PricingRule, 'pricingRuleId' | 'createdAt'>;
