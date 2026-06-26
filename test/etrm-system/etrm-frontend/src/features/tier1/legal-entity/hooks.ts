import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { legalEntityApi } from './api';
import type { LegalEntityInput } from './types';
import type { ProblemDetail } from '@services/api';

const QUERY_KEY = ['legal-entities'] as const;

export function useLegalEntities() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: legalEntityApi.list });
}

export function useCreateLegalEntity() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: LegalEntityInput) => legalEntityApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('Legal entity created.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Create failed.');
    },
  });
}

export function useUpdateLegalEntity() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: LegalEntityInput }) =>
      legalEntityApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('Legal entity updated.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Update failed.');
    },
  });
}

export function useDeactivateLegalEntity() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => legalEntityApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('Legal entity deactivated.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Deactivate failed.');
    },
  });
}

export function useBulkCreateLegalEntities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inputs: LegalEntityInput[]) => legalEntityApi.bulkCreate(inputs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
