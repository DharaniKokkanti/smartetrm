import { apiClient } from '@services/api';
import type { Currency, CurrencyInput } from './types';
export const currenciesApi = {
  list: () => apiClient.get<Currency[]>('/currencies').then((r) => r.data),
  create: (input: CurrencyInput) => apiClient.post<Currency>('/currencies', input).then((r) => r.data),
  update: (id: number, input: Partial<CurrencyInput>) => apiClient.put<Currency>(`/currencies/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/currencies/${id}/deactivate`, {}),
};
