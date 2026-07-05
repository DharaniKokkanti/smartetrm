import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { countriesApi } from './api';
import type { CountryInput } from './types';
import type { ProblemDetail } from '@services/api';
const KEY = ['countries'] as const;
export function useCountries() { return useQuery({ queryKey: KEY, queryFn: countriesApi.list, staleTime: 5*60*1000 }); }
export function useSaveCountry() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ code, input }: { code: string|null; input: CountryInput }) => code ? countriesApi.update(code, input) : countriesApi.create(input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
export function useDeactivateCountry() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (code: string) => countriesApi.deactivate(code),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
