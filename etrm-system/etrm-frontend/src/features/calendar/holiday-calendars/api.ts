import { apiClient } from '@services/api';
import type { HolidayCalendar, HolidayCalendarInput, CalendarHoliday } from './types';

export const holidayCalendarsApi = {
  list: () => apiClient.get<HolidayCalendar[]>('/holiday-calendars').then((r) => r.data),
  create: (input: HolidayCalendarInput) => apiClient.post<HolidayCalendar>('/holiday-calendars', input).then((r) => r.data),
  update: (id: number, input: HolidayCalendarInput) => apiClient.put<HolidayCalendar>(`/holiday-calendars/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/holiday-calendars/${id}/deactivate`),
  listHolidays: (calendarId: number) => apiClient.get<CalendarHoliday[]>(`/holiday-calendars/${calendarId}/holidays`).then((r) => r.data),
};
