import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { cpGtcAgreementsApi } from './api';
import type { CpGtcAgreementInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['cp-gtc-agreements'] as const;

export function useCpGtcAgreements() {
  return useQuery({ queryKey: KEY, queryFn: cpGtcAgreementsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveCpGtcAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CpGtcAgreementInput }) =>
      id === null ? cpGtcAgreementsApi.create(input) : cpGtcAgreementsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('GTC agreement saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateCpGtcAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: cpGtcAgreementsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('GTC agreement deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
