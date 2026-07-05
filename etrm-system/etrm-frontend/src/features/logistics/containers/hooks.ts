import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { containersApi } from './api';
import type { ContainerInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['containers'] as const;

export function useContainers() {
  return useQuery({ queryKey: KEY, queryFn: containersApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveContainer() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: ContainerInput }) =>
      id === null ? containersApi.create(input) : containersApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Container saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateContainer() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: containersApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Container deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
