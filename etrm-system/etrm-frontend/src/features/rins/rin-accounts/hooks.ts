import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { rinAccountApi } from './api';
import type { RinAccountInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['rin-accounts'] as const;

export function useRinAccounts() {
  return useQuery({ queryKey: KEY, queryFn: rinAccountApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveRinAccount() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: RinAccountInput }) =>
      id === null ? rinAccountApi.create(input) : rinAccountApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('RIN account saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateRinAccount() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => rinAccountApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('RIN account deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
