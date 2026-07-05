import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { marginAccountsApi } from './api';
import type { MarginAccountInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['margin-accounts'] as const;

export function useMarginAccounts() {
  return useQuery({ queryKey: KEY, queryFn: marginAccountsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveMarginAccount() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarginAccountInput }) =>
      id === null ? marginAccountsApi.create(input) : marginAccountsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Margin account saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateMarginAccount() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: marginAccountsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Margin account deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
