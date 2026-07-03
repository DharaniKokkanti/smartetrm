import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { glAccountApi } from './api';
import type { GlAccountInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['gl-accounts'] as const;

export function useGlAccounts() {
  return useQuery({ queryKey: KEY, queryFn: glAccountApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveGlAccount() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: GlAccountInput }) =>
      id === null ? glAccountApi.create(input) : glAccountApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('GL account saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateGlAccount() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => glAccountApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('GL account deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
