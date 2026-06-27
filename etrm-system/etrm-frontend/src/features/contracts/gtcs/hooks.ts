import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { gtcsApi } from './api';
import type { GtcInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['gtcs'] as const;

export function useGtcs() {
  return useQuery({ queryKey: KEY, queryFn: gtcsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveGtc() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: GtcInput }) =>
      id === null ? gtcsApi.create(input) : gtcsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateGtc() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: gtcsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
