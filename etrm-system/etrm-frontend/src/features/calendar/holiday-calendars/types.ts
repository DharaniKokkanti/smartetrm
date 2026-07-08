export const CALENDAR_TYPES = ['BANKING', 'COMMODITY', 'EXCHANGE', 'CUSTOM'] as const;
export type CalendarType = (typeof CALENDAR_TYPES)[number];

export interface HolidayCalendar {
  calendarId: number;
  calendarCode: string;
  calendarName: string;
  calendarType: CalendarType;
  countryCode: string | null;
  currencyCode: string | null;
  description: string | null;
  isActive: boolean;
  holidayCount: number;
  createdAt: string;
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
