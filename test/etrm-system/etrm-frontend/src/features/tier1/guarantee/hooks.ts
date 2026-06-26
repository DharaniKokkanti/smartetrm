import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { guaranteeApi } from './api';
import type { ParentCompanyGuaranteeInput } from './types';
import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';
import type { ProblemDetail } from '@services/api';

const LIST_KEY = ['guarantees'] as const;

export function useGuarantees() {
  return useQuery({ queryKey: LIST_KEY, queryFn: guaranteeApi.list });
}

export function useGuaranteesForEntity(entityType: PolymorphicEntityType, entityId: number | null) {
  return useQuery({
    queryKey: ['guarantees', 'for-entity', entityType, entityId],
    queryFn: () => guaranteeApi.listForEntity(entityType, entityId!),
    enabled: entityId !== null,
  });
}

export function useSaveGuarantee() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: ParentCompanyGuaranteeInput }) =>
      id === null ? guaranteeApi.create(input) : guaranteeApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ['guarantees', 'for-entity'] });
      message.success('Guarantee saved.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Save failed.'),
  });
}

export function useDeactivateGuarantee() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => guaranteeApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: ['guarantees', 'for-entity'] });
      message.success('Guarantee deactivated.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Deactivate failed.'),
  });
}
