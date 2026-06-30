import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { marginAgreementsApi } from './api';
import type { MarginAgreementInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['credit-margin-agreements'] as const;

export function useMarginAgreements() {
  return useQuery({ queryKey: KEY, queryFn: marginAgreementsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveMarginAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarginAgreementInput }) =>
      id === null ? marginAgreementsApi.create(input) : marginAgreementsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Margin agreement "${d.agreementCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateMarginAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: marginAgreementsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Margin agreement deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
