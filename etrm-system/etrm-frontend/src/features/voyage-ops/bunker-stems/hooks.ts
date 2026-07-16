import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { bunkerStemsApi } from './api';
import type { BunkerStemInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['bunker-stems'] as const;

export function useBunkerStems(params?: { voyageId?: number; vesselId?: number }) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => bunkerStemsApi.list(params), staleTime: 60 * 1000 });
}

export function useSaveBunkerStem() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: BunkerStemInput }) =>
      id === null ? bunkerStemsApi.create(input) : bunkerStemsApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['bunker-rob-ledger'] });
      message.success('Bunker stem saved.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateBunkerStem() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: bunkerStemsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Bunker stem deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
