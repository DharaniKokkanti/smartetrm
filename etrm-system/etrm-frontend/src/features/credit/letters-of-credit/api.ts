import { apiClient } from '@services/api';
import type { LetterOfCredit, LetterOfCreditInput } from './types';

export const lettersOfCreditApi = {
  list: () => apiClient.get<LetterOfCredit[]>('/credit/letters-of-credit').then((r) => r.data),
  create: (input: LetterOfCreditInput) => apiClient.post<LetterOfCredit>('/credit/letters-of-credit', input).then((r) => r.data),
  update: (id: number, input: LetterOfCreditInput) => apiClient.put<LetterOfCredit>(`/credit/letters-of-credit/${id}`, input).then((r) => r.data),
  cancel: (id: number) => apiClient.patch(`/credit/letters-of-credit/${id}/cancel`),
};
