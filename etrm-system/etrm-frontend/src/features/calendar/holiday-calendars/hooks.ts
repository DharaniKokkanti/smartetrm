import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { holidayCalendarsApi } from './api';
import type { HolidayCalendarInput, HolidayInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['holiday-calendars'] as const;

export function useHolidayCalendars() {
  return useQuery({ queryKey: KEY, queryFn: holidayCalendarsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useCalendarHolidays(calendarId: number | null) {
  return useQuery({
    queryKey: [...KEY, calendarId, 'holidays'],
    queryFn: () => holidayCalendarsApi.listHolidays(calendarId!),
    enabled: calendarId != null,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveHolidayCalendar() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: HolidayCalendarInput }) =>
      id === null ? holidayCalendarsApi.create(input) : holidayCalendarsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Calendar "${d.calendarCode}" saved.`); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) {
        showOptimisticLockConflict(notification);
      } else {
        message.error(e.detail ?? e.title ?? 'Save failed.');
      }
    },
  });
}

export function useDeactivateHolidayCalendar() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: holidayCalendarsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Calendar deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

export function useSaveHoliday(calendarId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: HolidayInput) => holidayCalendarsApi.createHoliday(calendarId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, calendarId, 'holidays'] });
      qc.invalidateQueries({ queryKey: KEY });
      message.success('Holiday added.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteHoliday(calendarId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (holidayId: number) => holidayCalendarsApi.deleteHoliday(calendarId, holidayId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, calendarId, 'holidays'] });
      qc.invalidateQueries({ queryKey: KEY });
      message.success('Holiday removed.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}

export function useBulkCreateHolidays(calendarId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (inputs: HolidayInput[]) => holidayCalendarsApi.bulkCreateHolidays(calendarId, inputs),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...KEY, calendarId, 'holidays'] });
      qc.invalidateQueries({ queryKey: KEY });
    },
  });
}
