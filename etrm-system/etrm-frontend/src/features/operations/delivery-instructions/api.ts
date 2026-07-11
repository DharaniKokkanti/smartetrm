import { apiClient } from '@services/api';
import type { DeliveryInstruction, DeliveryInstructionInput } from './types';

export const deliveryInstructionsApi = {
  list: () => apiClient.get<DeliveryInstruction[]>('/operations/delivery-instructions').then((r) => r.data),
  create: (input: DeliveryInstructionInput) => apiClient.post<DeliveryInstruction>('/operations/delivery-instructions', input).then((r) => r.data),
  update: (id: number, input: DeliveryInstructionInput) => apiClient.put<DeliveryInstruction>(`/operations/delivery-instructions/${id}`, input).then((r) => r.data),
};
