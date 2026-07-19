export const CALENDAR_TYPES = ['BANKING', 'COMMODITY', 'EXCHANGE', 'CUSTOM'] as const;
export type CalendarType = (typeof CALENDAR_TYPES)[number];

export interface HolidayCalendar {
  calendarId: number;
  calendarCode: string;
  calendarName: string;
  calendarType: CalendarType;
  countryId: number | null;
  currencyId: number | null;
  description: string | null;
  isActive: boolean;
  holidayCount: number;
  createdAt: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}

export type HolidayCalendarInput = Omit<HolidayCalendar, 'calendarId' | 'holidayCount' | 'createdAt'>;

export interface CalendarHoliday {
  holidayId: number;
  calendarId: number;
  holidayDate: string;
  holidayName: string;
  isSettlementHoliday: boolean;
  isTradingHoliday: boolean;
}

export type HolidayInput = Omit<CalendarHoliday, 'holidayId'>;

export interface HolidayUploadRow extends HolidayInput {
  _rowNumber: number;
  _errors: string[];
}
