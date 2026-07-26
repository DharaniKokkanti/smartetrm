import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { periodsApi } from './api';
import type { AutoGenerateRequest, PeriodInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['periods'] as const;
const MP_KEY = ['periods', 'market-product-links'] as const;

export function usePeriods() {
  return useQuery({ queryKey: KEY, queryFn: periodsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useMarketProductLinkOptions() {
  return useQuery({ queryKey: MP_KEY, queryFn: periodsApi.listMarketProductLinks, staleTime: 5 * 60 * 1000 });
}

export function useSavePeriod() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PeriodInput }) =>
      id === null ? periodsApi.create(input) : periodsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Period "${d.periodCode}" saved.`); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) {
        showOptimisticLockConflict(notification);
      } else {
        message.error(e.detail ?? e.title ?? 'Save failed.');
      }
    },
  });
}

export function useDeactivatePeriod() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: periodsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Period deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

export function useBulkCreatePeriods() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: periodsApi.bulkCreate,
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: KEY });
      if (result.rejected.length === 0) {
        message.success(`${result.created.length} period(s) created.`);
      } else {
        message.warning(`${result.created.length} created, ${result.rejected.length} rejected — see details.`);
      }
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Upload failed.'),
  });
}

export function useAutoGeneratePeriods() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (request: AutoGenerateRequest) => periodsApi.autoGenerate(request),
    onSuccess: (created) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`${created.length} period(s) auto-generated.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Auto-generate failed.'),
  });
}
