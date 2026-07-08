import { apiClient } from '@services/api';
import type { HolidayCalendar, HolidayCalendarInput, CalendarHoliday, HolidayInput } from './types';

export const holidayCalendarsApi = {
  list: () => apiClient.get<HolidayCalendar[]>('/holiday-calendars').then((r) => r.data),
  create: (input: HolidayCalendarInput) => apiClient.post<HolidayCalendar>('/holiday-calendars', input).then((r) => r.data),
  update: (id: number, input: HolidayCalendarInput) => apiClient.put<HolidayCalendar>(`/holiday-calendars/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/holiday-calendars/${id}/deactivate`),
  listHolidays: (calendarId: number) => apiClient.get<CalendarHoliday[]>(`/holiday-calendars/${calendarId}/holidays`).then((r) => r.data),
  createHoliday: (calendarId: number, input: HolidayInput) =>
    apiClient.post<CalendarHoliday>(`/holiday-calendars/${calendarId}/holidays`, input).then((r) => r.data),
  deleteHoliday: (calendarId: number, holidayId: number) =>
    apiClient.delete(`/holiday-calendars/${calendarId}/holidays/${holidayId}`),
  /** Bulk create from a validated Excel upload — same duplicate-rejection contract as legal-entity bulk. */
  bulkCreateHolidays: (calendarId: number, inputs: HolidayInput[]) =>
    apiClient
      .post<{ created: CalendarHoliday[]; rejected: { row: HolidayInput; reason: string }[] }>(
        `/holiday-calendars/${calendarId}/holidays/bulk`,
        { holidays: inputs },
      )
      .then((r) => r.data),
};
