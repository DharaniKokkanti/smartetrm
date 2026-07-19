import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { environmentalProductApi } from './api';
import type { EnvironmentalProductInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['environmental-products'] as const;

export function useEnvironmentalProducts() {
  return useQuery({ queryKey: KEY, queryFn: environmentalProductApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveEnvironmentalProduct() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: EnvironmentalProductInput }) =>
      id === null ? environmentalProductApi.create(input) : environmentalProductApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Environmental product saved.'); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) {
        showOptimisticLockConflict(notification);
      } else {
        message.error(e.detail ?? e.title ?? 'Save failed.');
      }
    },
  });
}

export function useDeactivateEnvironmentalProduct() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => environmentalProductApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Product deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
