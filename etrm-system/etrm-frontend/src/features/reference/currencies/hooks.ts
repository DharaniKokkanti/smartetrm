import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { currenciesApi } from './api';
import type { CurrencyInput } from './types';
import type { ProblemDetail } from '@services/api';
const KEY = ['currencies'] as const;
export function useCurrencies() { return useQuery({ queryKey: KEY, queryFn: currenciesApi.list, staleTime: 5*60*1000 }); }
export function useSaveCurrency() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number|null; input: CurrencyInput }) => id ? currenciesApi.update(id, input) : currenciesApi.create(input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
export function useDeactivateCurrency() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => currenciesApi.deactivate(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
