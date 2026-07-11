import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { deliveryInstructionsApi } from './api';
import type { DeliveryInstructionInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['delivery-instructions'] as const;

export function useDeliveryInstructions() {
  return useQuery({ queryKey: KEY, queryFn: deliveryInstructionsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveDeliveryInstruction() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: DeliveryInstructionInput }) =>
      id === null ? deliveryInstructionsApi.create(input) : deliveryInstructionsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Delivery instruction "${d.instructionReference}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
