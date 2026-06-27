import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { pricingRulesApi } from './api';
import type { PricingRuleInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['pricing-rules'] as const;

export function usePricingRules() {
  return useQuery({ queryKey: KEY, queryFn: pricingRulesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePricingRule() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PricingRuleInput }) =>
      id === null ? pricingRulesApi.create(input) : pricingRulesApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Pricing rule "${d.ruleCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePricingRule() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: pricingRulesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Pricing rule deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
