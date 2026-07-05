import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { incotermsApi } from './api';
import type { IncotermInput } from './types';
import type { ProblemDetail } from '@services/api';
const KEY = ['incoterms-ref'] as const;
export function useIncotermsRef() { return useQuery({ queryKey: KEY, queryFn: incotermsApi.list, staleTime: 5*60*1000 }); }
export function useSaveIncoterm() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number|null; input: IncotermInput }) => id ? incotermsApi.update(id, input) : incotermsApi.create(input),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
export function useDeactivateIncoterm() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => incotermsApi.deactivate(id),
    onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
