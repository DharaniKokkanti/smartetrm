import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { bolmoApi, bolmoLegsApi } from './api';
import type { BolmoAgreementInput, BolmoLegInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['bolmo-agreements'] as const;
const legsKey = (id: number) => ['bolmo-legs', id] as const;

export function useBolmoAgreements() {
  return useQuery({ queryKey: KEY, queryFn: bolmoApi.list, staleTime: 2 * 60 * 1000 });
}

export function useBolmoLegs(bolmoId: number | null) {
  return useQuery({
    queryKey: legsKey(bolmoId ?? 0),
    queryFn: () => bolmoLegsApi.list(bolmoId!),
    enabled: bolmoId !== null,
    staleTime: 60 * 1000,
  });
}

export function useSaveBolmoAgreement() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: BolmoAgreementInput }) =>
      id === null ? bolmoApi.create(input) : bolmoApi.update(id, input),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: KEY });
      message.success(`BOLMO agreement ${d.bolmoReference} saved.`);
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

function makeStatusMutation(action: 'agree' | 'complete' | 'dispute' | 'cancel') {
  const labels: Record<string, string> = { agree: 'Agreed', complete: 'Completed', dispute: 'Disputed', cancel: 'Cancelled' };
  return function useMut() {
    const qc = useQueryClient();
    const { message } = AntApp.useApp();
    return useMutation({
      mutationFn: (id: number) => bolmoApi[action](id),
      onSuccess: (d) => {
        qc.invalidateQueries({ queryKey: KEY });
        message.success(`${d.bolmoReference} → ${labels[action]}.`);
      },
      onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Action failed.'),
    });
  };
}

export const useAgreeBolmo = makeStatusMutation('agree');
export const useCompleteBolmo = makeStatusMutation('complete');
export const useDisputeBolmo = makeStatusMutation('dispute');
export const useCancelBolmo = makeStatusMutation('cancel');

export function useAddBolmoLeg(bolmoId: number | null) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: BolmoLegInput) => bolmoLegsApi.create(bolmoId!, input),
    onSuccess: () => {
      if (bolmoId !== null) qc.invalidateQueries({ queryKey: legsKey(bolmoId) });
      qc.invalidateQueries({ queryKey: KEY });
      message.success('Leg added.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Add leg failed.'),
  });
}

export function useDeleteBolmoLeg(bolmoId: number | null) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (legId: number) => bolmoLegsApi.delete(legId),
    onSuccess: () => {
      if (bolmoId !== null) qc.invalidateQueries({ queryKey: legsKey(bolmoId) });
      qc.invalidateQueries({ queryKey: KEY });
      message.success('Leg removed.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Remove leg failed.'),
  });
}
