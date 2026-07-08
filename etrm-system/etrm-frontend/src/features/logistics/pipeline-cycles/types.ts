export const CYCLE_TYPES = ['INTRADAY', 'DAILY', 'MONTHLY', 'ADHOC'] as const;
export type CycleType = (typeof CYCLE_TYPES)[number];

export const APPLIES_TO_DAYS = [
  'ALL', 'WEEKDAYS', 'WEEKENDS',
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY',
] as const;
export type AppliesToDays = (typeof APPLIES_TO_DAYS)[number];

export interface PipelineCycle {
  cycleId: number;
  pipelineId: number;
  pipelineName: string;
  cycleType: CycleType;
  cycleCode: string;
  cycleName: string;
  productId: number | null;
  productName: string | null;
  nominationDeadline: string | null;
  confirmationDeadline: string | null;
  schedulingDeadline: string | null;
  effectiveStart: string | null;
  effectiveEnd: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  calendarId: number | null;
  calendarName: string | null;
  appliesToDays: AppliesToDays;
  tolerancePct: number | null;
  cyclePriority: number;
  isActive: boolean;
  notes: string | null;
}

export type PipelineCycleInput = Omit<PipelineCycle, 'cycleId' | 'pipelineName' | 'calendarName' | 'productName'>;
