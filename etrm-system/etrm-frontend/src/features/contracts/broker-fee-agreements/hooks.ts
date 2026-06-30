import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { bfaApi } from './api';
import type { BrokerFeeAgreementInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['broker-fee-agreements'] as const;

export function useBrokerFeeAgreements() {
  return useQuery({ queryKey: KEY, queryFn: bfaApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveBrokerFeeAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: BrokerFeeAgreementInput }) =>
      id === null ? bfaApi.create(input) : bfaApi.update(id, input),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: KEY });
      message.success(`Agreement "${d.agreementCode}" saved.`);
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateBrokerFeeAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: bfaApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      message.success('Agreement deactivated.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
