import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App } from 'antd';
import { balmoProductsApi } from './api';
import type { BalmoProductInput } from './types';

const QK = 'balmo-products';

export function useBalmoProducts() {
  return useQuery({ queryKey: [QK], queryFn: balmoProductsApi.list });
}

export function useSaveBalmoProduct() {
  const qc = useQueryClient();
  const { message } = App.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: BalmoProductInput }) =>
      id ? balmoProductsApi.update(id, input) : balmoProductsApi.create(input),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: [QK] });
      void message.success(id ? 'BALMO product updated' : 'BALMO product created');
    },
    onError: () => { void message.error('Failed to save BALMO product'); },
  });
}
