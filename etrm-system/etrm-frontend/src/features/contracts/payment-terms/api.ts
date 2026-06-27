import { apiClient } from '@services/api';
import type { PaymentTerm, PaymentTermInput } from './types';

export const paymentTermsApi = {
  list: () => apiClient.get<PaymentTerm[]>('/payment-terms').then((r) => r.data),
  create: (input: PaymentTermInput) => apiClient.post<PaymentTerm>('/payment-terms', input).then((r) => r.data),
  update: (id: number, input: PaymentTermInput) => apiClient.put<PaymentTerm>(`/payment-terms/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/payment-terms/${id}/deactivate`),
};
