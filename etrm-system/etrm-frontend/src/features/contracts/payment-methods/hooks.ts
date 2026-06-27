import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { paymentMethodsApi } from './api';
import type { PaymentMethodInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['payment-methods'] as const;

export function usePaymentMethods() {
  return useQuery({ queryKey: KEY, queryFn: paymentMethodsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSavePaymentMethod() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PaymentMethodInput }) =>
      id === null ? paymentMethodsApi.create(input) : paymentMethodsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivatePaymentMethod() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: paymentMethodsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
