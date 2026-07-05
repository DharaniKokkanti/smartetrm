import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { collateralApi } from './api';
import type { CollateralInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['collateral'] as const;

export function useCollateral() {
  return useQuery({ queryKey: KEY, queryFn: collateralApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveCollateral() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: CollateralInput }) =>
      id === null ? collateralApi.create(input) : collateralApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Collateral record saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
