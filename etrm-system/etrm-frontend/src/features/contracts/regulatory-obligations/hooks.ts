import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { regulatoryObligationsApi } from './api';
import type { RegulatoryObligationInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['regulatory-obligations'] as const;

export function useRegulatoryObligations() {
  return useQuery({ queryKey: KEY, queryFn: regulatoryObligationsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveRegulatoryObligation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: RegulatoryObligationInput }) =>
      id === null ? regulatoryObligationsApi.create(input) : regulatoryObligationsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Regulatory obligation saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateRegulatoryObligation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: regulatoryObligationsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Regulatory obligation deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
