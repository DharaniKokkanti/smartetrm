import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { charterOffHireEventsApi, charterPartiesApi } from './api';
import type { CharterOffHireEventInput, CharterPartyInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['charter-parties'] as const;
const OFF_HIRE_KEY = ['charter-off-hire-events'] as const;

export function useCharterParties(params?: { vesselId?: number; counterpartyId?: number }) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => charterPartiesApi.list(params), staleTime: 60 * 1000 });
}

export function useCharterParty(id: number | null) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => charterPartiesApi.get(id as number), enabled: id !== null });
}

export function useSaveCharterParty() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CharterPartyInput }) =>
      id === null ? charterPartiesApi.create(input) : charterPartiesApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Charter party "${d.cpReference}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateCharterParty() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: charterPartiesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Charter party deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

export function useCharterOffHireEvents(charterPartyId: number | undefined) {
  return useQuery({
    queryKey: [...OFF_HIRE_KEY, charterPartyId],
    queryFn: () => charterOffHireEventsApi.list(charterPartyId),
    enabled: charterPartyId !== undefined,
  });
}

export function useSaveCharterOffHireEvent() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CharterOffHireEventInput }) =>
      id === null ? charterOffHireEventsApi.create(input) : charterOffHireEventsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: OFF_HIRE_KEY }); message.success('Off-hire event saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
