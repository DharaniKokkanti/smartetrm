import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { cpCommercialTermsApi } from './api';
import type { CpCommercialTermsInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['cp-commercial-terms'] as const;

export function useCpCommercialTerms() {
  return useQuery({ queryKey: KEY, queryFn: cpCommercialTermsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveCpCommercialTerms() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CpCommercialTermsInput }) =>
      id === null ? cpCommercialTermsApi.create(input) : cpCommercialTermsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Commercial terms saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateCpCommercialTerms() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: cpCommercialTermsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Commercial terms deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
