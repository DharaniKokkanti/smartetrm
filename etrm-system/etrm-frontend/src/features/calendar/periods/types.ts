export const PERIOD_TYPES = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL', 'PROMPT', 'SPOT', 'CUSTOM'] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const PERIOD_STATUS_CODES = ['OPEN', 'CLOSED', 'LOCKED', 'ARCHIVED'] as const;
export type PeriodStatusCode = (typeof PERIOD_STATUS_CODES)[number];

export interface Period {
  periodId: number;
  periodCode: string;
  periodName: string;
  periodType: PeriodType;
  startDate: string;
  endDate: string;
  deliveryStartDate: string | null;
  deliveryEndDate: string | null;
  pricingCalendarCode: string | null;
  settlementCalendarCode: string | null;
  statusCode: PeriodStatusCode;
  isActive: boolean;
  createdAt: string;
}

export type PeriodInput = Omit<Period, 'periodId' | 'createdAt'>;
