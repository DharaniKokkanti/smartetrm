import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { emissionObligationApi } from './api';
import type { EmissionObligationInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['emission-obligations'] as const;

export function useEmissionObligations() {
  return useQuery({ queryKey: KEY, queryFn: emissionObligationApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveEmissionObligation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: EmissionObligationInput }) =>
      id === null ? emissionObligationApi.create(input) : emissionObligationApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Obligation saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
