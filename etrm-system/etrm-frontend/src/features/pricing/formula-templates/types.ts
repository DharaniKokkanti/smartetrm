export const FORMULA_TYPES = ['INDEX', 'DIFFERENTIAL', 'AVERAGE', 'WEIGHTED_AVERAGE', 'BLEND', 'SPREAD', 'FORMULA'] as const;
export type FormulaType = (typeof FORMULA_TYPES)[number];

export const AVERAGING_TYPES = ['DAILY', 'WEIGHTED_DAILY', 'MONTHLY_AVERAGE', 'NONE'] as const;
export type AveragingType = (typeof AVERAGING_TYPES)[number];

export const AVERAGING_PERIOD_TYPES = ['PRICING_PERIOD', 'DELIVERY_MONTH', 'FIXED_WINDOW', 'CUSTOM'] as const;
export type AveragingPeriodType = (typeof AVERAGING_PERIOD_TYPES)[number];

export const FX_FIXING_TYPES = ['SPOT', 'AVERAGE', 'FIXED'] as const;
export type FxFixingType = (typeof FX_FIXING_TYPES)[number];

export interface FormulaTemplate {
  templateId: number;
  commodityType: string | null;
  templateCode: string;
  templateName: string;
  formulaType: FormulaType;
  formulaExpression: string | null;
  averagingType: AveragingType | null;
  averagingPeriodType: AveragingPeriodType | null;
  fxConversionRequired: boolean;
  fxFixingType: FxFixingType | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export type FormulaTemplateInput = Omit<FormulaTemplate, 'templateId' | 'createdAt'>;
