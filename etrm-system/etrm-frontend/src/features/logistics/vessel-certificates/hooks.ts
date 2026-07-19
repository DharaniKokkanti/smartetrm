import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { vesselCertificatesApi } from './api';
import type { VesselCertificateInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['vessel-certificates'] as const;

export function useVesselCertificates() {
  return useQuery({ queryKey: KEY, queryFn: vesselCertificatesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveVesselCertificate() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VesselCertificateInput }) =>
      id === null ? vesselCertificatesApi.create(input) : vesselCertificatesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Vessel certificate saved.'); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}
