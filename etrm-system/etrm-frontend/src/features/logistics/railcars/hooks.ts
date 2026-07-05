import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { railcarsApi } from './api';
import type { RailcarInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['railcars'] as const;

export function useRailcars() {
  return useQuery({ queryKey: KEY, queryFn: railcarsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveRailcar() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: RailcarInput }) =>
      id === null ? railcarsApi.create(input) : railcarsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Railcar saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateRailcar() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: railcarsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Railcar deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
