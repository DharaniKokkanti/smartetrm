import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { lettersOfCreditApi } from './api';
import type { LetterOfCreditInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['letters-of-credit'] as const;

export function useLettersOfCredit() {
  return useQuery({ queryKey: KEY, queryFn: lettersOfCreditApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveLetterOfCredit() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: LetterOfCreditInput }) =>
      id === null ? lettersOfCreditApi.create(input) : lettersOfCreditApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Letter of Credit "${d.lcReference}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useCancelLetterOfCredit() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: lettersOfCreditApi.cancel,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Letter of Credit cancelled.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Cancel failed.'),
  });
}
