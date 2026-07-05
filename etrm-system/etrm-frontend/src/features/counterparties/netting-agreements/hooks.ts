import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { nettingAgreementsApi } from './api';
import type { NettingAgreementInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['netting-agreements'] as const;

export function useNettingAgreements() {
  return useQuery({ queryKey: KEY, queryFn: nettingAgreementsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveNettingAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: NettingAgreementInput }) =>
      id === null ? nettingAgreementsApi.create(input) : nettingAgreementsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Netting agreement saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateNettingAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: nettingAgreementsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Netting agreement deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
