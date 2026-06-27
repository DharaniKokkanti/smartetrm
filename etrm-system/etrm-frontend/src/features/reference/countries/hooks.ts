import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { countriesApi } from './api';
import type { CountryInput } from './types';
const KEY = ['countries'] as const;
export function useCountries() { return useQuery({ queryKey: KEY, queryFn: countriesApi.list, staleTime: 5*60*1000 }); }
export function useSaveCountry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ code, input }: { code: string|null; input: CountryInput }) => code ? countriesApi.update(code, input) : countriesApi.create(input), onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); } });
}
export function useDeactivateCountry() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (code: string) => countriesApi.deactivate(code), onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); } });
}
