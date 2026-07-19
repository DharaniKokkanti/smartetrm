import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { vesselPerformanceCurvesApi } from './api';
import type { VesselPerformanceCurveInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['vessel-performance-curves'] as const;

export function useVesselPerformanceCurves(vesselId?: number) {
  return useQuery({ queryKey: [...KEY, vesselId], queryFn: () => vesselPerformanceCurvesApi.list(vesselId), staleTime: 5 * 60 * 1000 });
}

export function useSaveVesselPerformanceCurve() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VesselPerformanceCurveInput }) =>
      id === null ? vesselPerformanceCurvesApi.create(input) : vesselPerformanceCurvesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Performance curve saved.'); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useDeactivateVesselPerformanceCurve() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: vesselPerformanceCurvesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Performance curve deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
