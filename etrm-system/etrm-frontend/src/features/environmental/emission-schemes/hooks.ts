import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { emissionSchemeApi } from './api';
import type { EmissionSchemeInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['emission-schemes'] as const;

export function useEmissionSchemes() {
  return useQuery({ queryKey: KEY, queryFn: emissionSchemeApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveEmissionScheme() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: EmissionSchemeInput }) =>
      id === null ? emissionSchemeApi.create(input) : emissionSchemeApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Emission scheme saved.'); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) {
        showOptimisticLockConflict(notification);
      } else {
        message.error(e.detail ?? e.title ?? 'Save failed.');
      }
    },
  });
}

export function useDeactivateEmissionScheme() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => emissionSchemeApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Scheme deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
