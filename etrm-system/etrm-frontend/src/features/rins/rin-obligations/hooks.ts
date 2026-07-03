import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { rinObligationApi } from './api';
import type { RinObligationInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['rin-obligations'] as const;

export function useRinObligations() {
  return useQuery({ queryKey: KEY, queryFn: rinObligationApi.list, staleTime: 60 * 1000 });
}

export function useSaveRinObligation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: RinObligationInput }) =>
      id === null ? rinObligationApi.create(input) : rinObligationApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('RVO obligation saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
