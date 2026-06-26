import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { desksApi } from './api';
import type { DeskInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['desks'] as const;

export function useDesks() {
  return useQuery({ queryKey: KEY, queryFn: desksApi.list });
}

export function useSaveDesk() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: DeskInput }) =>
      id === null ? desksApi.create(input) : desksApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Desk "${d.deskCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateDesk() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: desksApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Desk deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
