import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { clearingAccountMarginRatesApi } from './api';
import type { ClearingAccountMarginRateInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const key = (clearingAccountId: number) => ['clearing-account-margin-rates', clearingAccountId] as const;

export function useClearingAccountMarginRates(clearingAccountId: number | null) {
  return useQuery({
    queryKey: key(clearingAccountId ?? -1),
    queryFn: () => clearingAccountMarginRatesApi.list(clearingAccountId as number),
    enabled: clearingAccountId !== null,
  });
}

export function useSaveClearingAccountMarginRate(clearingAccountId: number | null) {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: ClearingAccountMarginRateInput }) =>
      id === null ? clearingAccountMarginRatesApi.create(input) : clearingAccountMarginRatesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(clearingAccountId ?? -1) });
      message.success('Margin rate saved.');
    },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useDeactivateClearingAccountMarginRate(clearingAccountId: number | null) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: clearingAccountMarginRatesApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(clearingAccountId ?? -1) });
      message.success('Margin rate deactivated.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
