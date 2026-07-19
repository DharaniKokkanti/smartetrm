import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { vesselCargoTanksApi } from './api';
import type { VesselCargoTankInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['vessel-cargo-tanks'] as const;

export function useVesselCargoTanks(vesselId?: number) {
  return useQuery({ queryKey: [...KEY, vesselId], queryFn: () => vesselCargoTanksApi.list(vesselId), staleTime: 5 * 60 * 1000 });
}

export function useSaveVesselCargoTank() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VesselCargoTankInput }) =>
      id === null ? vesselCargoTanksApi.create(input) : vesselCargoTanksApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Cargo tank saved.'); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useDeactivateVesselCargoTank() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: vesselCargoTanksApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Cargo tank deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
