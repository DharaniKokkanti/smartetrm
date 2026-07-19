import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { bankGuaranteesApi } from './api';
import type { BankGuaranteeInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['bank-guarantees'] as const;

export function useBankGuarantees() {
  return useQuery({ queryKey: KEY, queryFn: bankGuaranteesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveBankGuarantee() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: BankGuaranteeInput }) =>
      id === null ? bankGuaranteesApi.create(input) : bankGuaranteesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Bank guarantee saved.'); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}
