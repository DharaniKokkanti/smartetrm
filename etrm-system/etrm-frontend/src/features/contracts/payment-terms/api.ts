import { apiClient } from '@services/api';
import type { PaymentTerm, PaymentTermInput } from './types';

export const paymentTermsApi = {
  list: () => apiClient.get<PaymentTerm[]>('/payment-terms').then((r) => r.data),
  create: (input: PaymentTermInput) => apiClient.post<PaymentTerm>('/payment-terms', input).then((r) => r.data),
  update: (id: number, input: PaymentTermInput) => apiClient.put<PaymentTerm>(`/payment-terms/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/payment-terms/${id}/deactivate`),
  /** baseDate (YYYY-MM-DD) is the caller-resolved date for the term's base_date_event. */
  calculateDueDate: (id: number, baseDate: string) =>
    apiClient.get<{ dueDate: string }>(`/payment-terms/${id}/due-date`, { params: { baseDate } })
      .then((r) => r.data.dueDate),
};
