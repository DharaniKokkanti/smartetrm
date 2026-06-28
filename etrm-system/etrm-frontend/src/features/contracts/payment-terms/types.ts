export type BaseDateEvent =
  | 'INVOICE_DATE'
  | 'TRADE_DATE'
  | 'DELIVERY_DATE'
  | 'END_OF_DELIVERY_MONTH'
  | 'BL_DATE'
  | 'NOR_TENDERED'
  | 'COMPLETION_OF_DISCHARGE'
  | 'OUTTURN_DATE'
  | 'PRICING_DATE'
  | 'METER_READ_DATE'
  | 'SETTLEMENT_DATE';

export type BusinessDayConvention =
  | 'UNADJUSTED'
  | 'FOLLOWING'
  | 'MOD_FOLLOWING'
  | 'PRECEDING'
  | 'MOD_PRECEDING';

export type DaysBasis = 'CALENDAR' | 'BUSINESS';

export type PaymentMethod =
  | 'WIRE'
  | 'LETTER_OF_CREDIT'
  | 'BANK_GUARANTEE'
  | 'PREPAYMENT'
  | 'NETTING'
  | 'CHEQUE'
  | 'OTHER';

export interface PaymentTerm {
  paymentTermId: number;
  termCode: string;
  termName: string;

  /** Anchor event from which payment date is calculated */
  baseDateEvent: BaseDateEvent;
  /** Whole months added to base date before day offset (e.g. 1 = following month) */
  monthOffset: number;
  /** Calendar or business days added after month offset; negative = prepayment */
  offsetDays: number;
  daysBasis: DaysBasis;
  /** If set, snap to this day-of-month instead of using offsetDays */
  fixedDayOfMonth: number | null;

  /** How to adjust when the calculated date falls on a non-business day */
  businessDayConvention: BusinessDayConvention;
  /** Holiday calendar used for business-day rolling */
  calendarId: number | null;

  /** Early payment discount: days within which discount applies */
  discountDays: number | null;
  /** Early payment discount rate, e.g. 0.0200 = 2 % */
  discountPct: number | null;

  paymentMethod: PaymentMethod;
  /** Days before/after base date to issue invoice (negative = issue before) */
  invoiceLeadDays: number | null;

  isDefault: boolean;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export type PaymentTermInput = Omit<PaymentTerm, 'paymentTermId' | 'createdAt'>;
