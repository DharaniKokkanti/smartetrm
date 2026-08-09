import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { marginOffsetRulesApi, marketProductLinksApi } from './api';
import type { MarginOffsetRuleInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const key = (exchangeId: number) => ['margin-offset-rules', exchangeId] as const;

export function useMarketProductLinks() {
  return useQuery({ queryKey: ['market-product-links', 'all'], queryFn: marketProductLinksApi.listAll, staleTime: 5 * 60_000 });
}

export function useMarginOffsetRules(exchangeId: number | null) {
  return useQuery({
    queryKey: key(exchangeId ?? -1),
    queryFn: () => marginOffsetRulesApi.list(exchangeId as number),
    enabled: exchangeId !== null,
  });
}

export function useSaveMarginOffsetRule(exchangeId: number | null) {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: MarginOffsetRuleInput }) =>
      id === null ? marginOffsetRulesApi.create(input) : marginOffsetRulesApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(exchangeId ?? -1) });
      message.success('Margin offset rule saved.');
    },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useDeactivateMarginOffsetRule(exchangeId: number | null) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: marginOffsetRulesApi.deactivate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key(exchangeId ?? -1) });
      message.success('Margin offset rule deactivated.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
