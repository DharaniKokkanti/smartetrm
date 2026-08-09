export interface MarginOffsetRule {
  marginOffsetRuleId: number;
  rowVersion: number;
  exchangeId: number;
  exchangeCode: string | null;
  leg1MarketProductLinkId: number;
  leg1Label: string | null;
  leg2MarketProductLinkId: number;
  leg2Label: string | null;
  offsetRatioLeg1: number;
  offsetRatioLeg2: number;
  imReductionPct: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type MarginOffsetRuleInput = Omit<
  MarginOffsetRule,
  'marginOffsetRuleId' | 'exchangeCode' | 'leg1Label' | 'leg2Label' | 'createdAt'
>;
