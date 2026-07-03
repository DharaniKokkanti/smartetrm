import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { carbonRegistryApi } from './api';
import type { CarbonRegistryInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['carbon-registries'] as const;

export function useCarbonRegistries() {
  return useQuery({ queryKey: KEY, queryFn: carbonRegistryApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveCarbonRegistry() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CarbonRegistryInput }) =>
      id === null ? carbonRegistryApi.create(input) : carbonRegistryApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Registry saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateCarbonRegistry() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => carbonRegistryApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Registry deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
