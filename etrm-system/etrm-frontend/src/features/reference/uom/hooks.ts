import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { uomApi } from './api';
import type { UomInput } from './types';
const KEY = ['uom'] as const;
export function useUom() { return useQuery({ queryKey: KEY, queryFn: uomApi.list, staleTime: 5*60*1000 }); }
export function useSaveUom() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ id, input }: { id: number|null; input: UomInput }) => id ? uomApi.update(id, input) : uomApi.create(input), onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); } });
}
export function useDeactivateUom() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => uomApi.deactivate(id), onSuccess: () => { void qc.invalidateQueries({ queryKey: KEY }); } });
}
