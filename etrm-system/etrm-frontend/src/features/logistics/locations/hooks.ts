import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { locationsApi } from './api';
import type { LocationInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['locations'] as const;

export function useLocations() {
  return useQuery({ queryKey: KEY, queryFn: locationsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveLocation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: LocationInput }) =>
      id === null ? locationsApi.create(input) : locationsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Location "${d.locationCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useTradingDeskLocations() {
  return useQuery({ queryKey: ['locations', 'trading-desks'], queryFn: locationsApi.listTradingDesks, staleTime: 5 * 60 * 1000 });
}

export function useDeactivateLocation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: locationsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Location deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
