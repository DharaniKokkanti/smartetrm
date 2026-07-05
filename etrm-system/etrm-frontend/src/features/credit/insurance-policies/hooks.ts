import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { insurancePoliciesApi } from './api';
import type { InsurancePolicyInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['insurance-policies'] as const;

export function useInsurancePolicies() {
  return useQuery({ queryKey: KEY, queryFn: insurancePoliciesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveInsurancePolicy() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: InsurancePolicyInput }) =>
      id === null ? insurancePoliciesApi.create(input) : insurancePoliciesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Insurance policy saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
