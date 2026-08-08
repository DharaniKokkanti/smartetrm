import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { contractMarginRatesApi } from './api';
import type { ContractMarginRateInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const key = (contractSpecId: number) => ['contract-margin-rates', contractSpecId] as const;

export function useContractMarginRates(contractSpecId: number | null) {
  return useQuery({
    queryKey: key(contractSpecId ?? -1),
    queryFn: () => contractMarginRatesApi.list(contractSpecId as number),
    enabled: contractSpecId !== null,
  });
}

export function useSaveContractMarginRate(contractSpecId: number | null) {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: ContractMarginRateInput }) =>
      id === null ? contractMarginRatesApi.create(input) : contractMarginRatesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(contractSpecId ?? -1) });
      message.success('Margin rate saved.');
    },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useDeactivateContractMarginRate(contractSpecId: number | null) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: contractMarginRatesApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(contractSpecId ?? -1) });
      message.success('Margin rate deactivated.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
