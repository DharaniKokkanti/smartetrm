import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { rinTransactionApi } from './api';
import type { RinTransactionInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['rin-transactions'] as const;

export function useRinTransactions() {
  return useQuery({ queryKey: KEY, queryFn: rinTransactionApi.list, staleTime: 60 * 1000 });
}

export function useCreateRinTransaction() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: RinTransactionInput) => rinTransactionApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['rin-inventory'] });
      qc.invalidateQueries({ queryKey: ['rin-obligations'] });
      message.success('RIN transaction recorded.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Transaction failed.'),
  });
}

export function useVoidRinTransaction() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => rinTransactionApi.void(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ['rin-inventory'] });
      message.success('Transaction voided.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Void failed.'),
  });
}
