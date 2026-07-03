import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { rinFuelCategoryApi } from './api';
import type { RinFuelCategoryInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['rin-fuel-categories'] as const;

export function useRinFuelCategories() {
  return useQuery({ queryKey: KEY, queryFn: rinFuelCategoryApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveRinFuelCategory() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: RinFuelCategoryInput }) =>
      id === null ? rinFuelCategoryApi.create(input) : rinFuelCategoryApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Fuel category saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateRinFuelCategory() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => rinFuelCategoryApi.deactivate(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Fuel category deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
