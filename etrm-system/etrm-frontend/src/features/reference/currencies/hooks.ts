import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { currenciesApi } from './api';
import type { CurrencyInput } from './types';
const KEY = ['currencies'] as const;
export function useCurrencies() { return useQuery({ queryKey: KEY, queryFn: currenciesApi.list, staleTime: 5*60*1000 }); }
export function useSaveCurrency() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: number|null; input: CurrencyInput }) => id ? currenciesApi.update(id, input) : currenciesApi.create(input), onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); } });
}
export function useDeactivateCurrency() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => currenciesApi.deactivate(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); } });
}
