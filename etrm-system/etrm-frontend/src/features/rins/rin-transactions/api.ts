import { apiClient } from '@services/api';
import type { RinTransaction, RinTransactionInput } from './types';

export const rinTransactionApi = {
  list: () => apiClient.get<RinTransaction[]>('/rin-transactions').then((r) => r.data),
  create: (input: RinTransactionInput) =>
    apiClient.post<RinTransaction>('/rin-transactions', input).then((r) => r.data),
  void: (id: number) => apiClient.patch(`/rin-transactions/${id}/void`, {}),
};
