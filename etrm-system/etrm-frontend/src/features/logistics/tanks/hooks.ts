import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { tanksApi } from './api';
import type { TankInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['tanks'] as const;

export function useTanks() {
  return useQuery({ queryKey: KEY, queryFn: tanksApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveTank() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: TankInput }) =>
      id === null ? tanksApi.create(input) : tanksApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Tank saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateTank() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: tanksApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Tank deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
