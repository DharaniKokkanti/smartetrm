import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { marginValuationsApi } from './api';
import type { MarginValuationInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const key = (clearingAccountId: number) => ['margin-valuations', clearingAccountId] as const;

export function useMarginValuations(clearingAccountId: number | null) {
  return useQuery({
    queryKey: key(clearingAccountId ?? -1),
    queryFn: () => marginValuationsApi.list(clearingAccountId as number),
    enabled: clearingAccountId !== null,
  });
}

export function useSaveMarginValuation(clearingAccountId: number | null) {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarginValuationInput }) =>
      id === null ? marginValuationsApi.create(input) : marginValuationsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(clearingAccountId ?? -1) });
      message.success('Margin valuation saved.');
    },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}
