import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { laytimeCalculationsApi } from './api';
import type { LaytimeCalculationInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['laytime-calculations'] as const;

export function useLaytimeCalculations(voyageId: number | undefined) {
  return useQuery({ queryKey: [...KEY, voyageId], queryFn: () => laytimeCalculationsApi.list(voyageId), enabled: voyageId !== undefined });
}

export function useCreateLaytimeCalculation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: LaytimeCalculationInput) => laytimeCalculationsApi.create(input),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: KEY });
      message.success(`Laytime calculation v${d.versionNumber} recorded.`);
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
