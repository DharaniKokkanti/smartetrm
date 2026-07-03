import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { settlementPricesApi } from './api';
import type { SettlementPriceInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['settlement-prices'] as const;

export function useSettlementPrices() {
  return useQuery({ queryKey: KEY, queryFn: settlementPricesApi.list, staleTime: 2 * 60 * 1000 });
}

export function useSaveSettlementPrice() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: SettlementPriceInput }) =>
      id === null ? settlementPricesApi.create(input) : settlementPricesApi.update(id, input),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: KEY });
      message.success(`Settlement price for ${d.contractTicker} on ${d.settleDate} saved.`);
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useConfirmSettlementPrice() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: settlementPricesApi.confirm,
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: KEY });
      message.success(`${d.contractTicker} settlement confirmed.`);
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Confirm failed.'),
  });
}
