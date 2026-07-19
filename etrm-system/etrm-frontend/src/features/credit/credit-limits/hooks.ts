import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { creditLimitsApi } from './api';
import type { CreditLimitInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['credit-limits'] as const;

export function useCreditLimits() {
  return useQuery({ queryKey: KEY, queryFn: creditLimitsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveCreditLimit() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CreditLimitInput }) =>
      id === null ? creditLimitsApi.create(input) : creditLimitsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Credit limit saved.'); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useSuspendCreditLimit() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: creditLimitsApi.suspend,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Credit limit suspended.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Suspend failed.'),
  });
}

export function useReinstateCreditLimit() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: creditLimitsApi.reinstate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Credit limit reinstated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Reinstate failed.'),
  });
}
