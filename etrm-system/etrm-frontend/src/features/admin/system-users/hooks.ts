import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { systemUsersApi } from './api';
import type { SystemUserInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['system-users'] as const;

export function useSystemUsers() {
  return useQuery({ queryKey: KEY, queryFn: systemUsersApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveSystemUser() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: SystemUserInput }) =>
      id === null ? systemUsersApi.create(input) : systemUsersApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`User "${d.username}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateSystemUser() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: systemUsersApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('User deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
