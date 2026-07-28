import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { volatilityPointsApi } from './api';
import type { VolatilityPointInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['volatility-points'] as const;

export function useVolatilityPoints() {
  return useQuery({ queryKey: KEY, queryFn: volatilityPointsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveVolatilityPoint() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VolatilityPointInput }) =>
      id === null ? volatilityPointsApi.create(input) : volatilityPointsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Volatility point saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useConfirmVolatilityPoint() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: volatilityPointsApi.confirm,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Volatility point confirmed.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Confirm failed.'),
  });
}
