import { apiClient } from '@services/api';
import type { PaymentMethod, PaymentMethodInput } from './types';

export const paymentMethodsApi = {
  list: () => apiClient.get<PaymentMethod[]>('/payment-methods').then((r) => r.data),
  create: (input: PaymentMethodInput) => apiClient.post<PaymentMethod>('/payment-methods', input).then((r) => r.data),
  update: (id: number, input: PaymentMethodInput) => apiClient.put<PaymentMethod>(`/payment-methods/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/payment-methods/${id}/deactivate`),
};
