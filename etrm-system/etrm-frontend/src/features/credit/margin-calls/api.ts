import { apiClient } from '@services/api';
import type { MarginCall, MarginCallInput } from './types';

export const marginCallsApi = {
  list: (marginAccountId: number) =>
    apiClient.get<MarginCall[]>('/credit/margin-calls', { params: { marginAccountId } }).then((r) => r.data),
  create: (input: MarginCallInput) =>
    apiClient.post<MarginCall>('/credit/margin-calls', input).then((r) => r.data),
  update: (id: number, input: MarginCallInput) =>
    apiClient.put<MarginCall>(`/credit/margin-calls/${id}`, input).then((r) => r.data),
};
