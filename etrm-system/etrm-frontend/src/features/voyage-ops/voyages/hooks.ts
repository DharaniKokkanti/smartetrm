import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { voyagesApi } from './api';
import type { VoyageInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['voyages'] as const;

export function useVoyages(params?: { vesselId?: number; charterPartyId?: number }) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => voyagesApi.list(params), staleTime: 60 * 1000 });
}

export function useVoyage(id: number | null) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => voyagesApi.get(id as number), enabled: id !== null });
}

export function useSaveVoyage() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VoyageInput }) =>
      id === null ? voyagesApi.create(input) : voyagesApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Voyage "${d.voyageNumber}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateVoyage() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: voyagesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Voyage deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
