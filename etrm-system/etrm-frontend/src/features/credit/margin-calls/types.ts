export const MARGIN_CALL_TYPES = ['INITIAL', 'VARIATION', 'INTRADAY', 'EXCESS_RETURN'] as const;
export type MarginCallType = (typeof MARGIN_CALL_TYPES)[number];

export const MARGIN_CALL_DIRECTIONS = ['PAY', 'RECEIVE'] as const;
export type MarginCallDirection = (typeof MARGIN_CALL_DIRECTIONS)[number];

export const MARGIN_CALL_STATUSES = ['PENDING', 'PAID', 'RECEIVED', 'DISPUTED', 'OVERDUE', 'WAIVED'] as const;
export type MarginCallStatus = (typeof MARGIN_CALL_STATUSES)[number];

export interface MarginCall {
  callId: number;
  rowVersion: number;
  marginAccountId: number;
  marginAccountCode: string | null;
  callDate: string;
  callType: MarginCallType;
  callDirection: MarginCallDirection;
  currencyId: number;
  currencyCode: string | null;
  callAmount: number;
  dueDate: string;
  status: MarginCallStatus;
  paidAmount: number | null;
  paidDate: string | null;
  marginValuationId: number | null;
  notes: string | null;
  createdAt: string;
}

export type MarginCallInput = Omit<
  MarginCall,
  'callId' | 'marginAccountCode' | 'currencyCode' | 'createdAt'
>;
