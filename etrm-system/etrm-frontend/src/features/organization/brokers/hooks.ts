import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { brokersApi } from './api';
import type { BrokerInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['brokers'] as const;

export function useBrokers() {
  return useQuery({ queryKey: KEY, queryFn: brokersApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveBroker() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: BrokerInput }) =>
      id === null ? brokersApi.create(input) : brokersApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Broker "${d.brokerCode}" saved.`); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useDeactivateBroker() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: brokersApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Broker deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
