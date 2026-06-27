import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { vesselsApi } from './api';
import type { VesselInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['vessels'] as const;

export function useVessels() {
  return useQuery({ queryKey: KEY, queryFn: vesselsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveVessel() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VesselInput }) =>
      id === null ? vesselsApi.create(input) : vesselsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Vessel "${d.vesselName}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateVessel() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: vesselsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Vessel deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
