import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { marginCallsApi } from './api';
import type { MarginCallInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const key = (marginAccountId: number) => ['margin-calls', marginAccountId] as const;

export function useMarginCalls(marginAccountId: number | null) {
  return useQuery({
    queryKey: key(marginAccountId ?? -1),
    queryFn: () => marginCallsApi.list(marginAccountId as number),
    enabled: marginAccountId !== null,
  });
}

export function useSaveMarginCall(marginAccountId: number | null) {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarginCallInput }) =>
      id === null ? marginCallsApi.create(input) : marginCallsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(marginAccountId ?? -1) });
      message.success('Margin call saved.');
    },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}
