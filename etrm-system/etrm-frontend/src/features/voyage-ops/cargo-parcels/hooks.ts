import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { cargoParcelsApi } from './api';
import type { VoyageCargoParcelInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['cargo-parcels'] as const;

export function useCargoParcels(voyageId: number | undefined) {
  return useQuery({ queryKey: [...KEY, voyageId], queryFn: () => cargoParcelsApi.list(voyageId), enabled: voyageId !== undefined });
}

export function useSaveCargoParcel() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VoyageCargoParcelInput }) =>
      id === null ? cargoParcelsApi.create(input) : cargoParcelsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Cargo parcel saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateCargoParcel() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: cargoParcelsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Cargo parcel deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
