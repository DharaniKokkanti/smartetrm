import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { optionIndexLinksApi } from './api';
import type { OptionIndexLinkInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['option-index-links'] as const;

export function useOptionIndexLinks() {
  return useQuery({ queryKey: KEY, queryFn: optionIndexLinksApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveOptionIndexLink() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: OptionIndexLinkInput }) =>
      id === null ? optionIndexLinksApi.create(input) : optionIndexLinksApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Option index link saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateOptionIndexLink() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: optionIndexLinksApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Option index link deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
