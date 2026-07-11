import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { nominationsApi } from './api';
import type { NominationInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['nominations'] as const;

export function useNominations() {
  return useQuery({ queryKey: KEY, queryFn: nominationsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveNomination() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: NominationInput }) =>
      id === null ? nominationsApi.create(input) : nominationsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Nomination "${d.nominationReference}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useTradeOrderOptions() {
  return useQuery({ queryKey: ['trade-order-options'], queryFn: nominationsApi.orderOptions, staleTime: 5 * 60 * 1000 });
}
