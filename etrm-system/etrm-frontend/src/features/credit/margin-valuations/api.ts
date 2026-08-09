import { apiClient } from '@services/api';
import type { MarginValuation, MarginValuationInput } from './types';

export const marginValuationsApi = {
  list: (clearingAccountId: number) =>
    apiClient.get<MarginValuation[]>('/credit/margin-valuations', { params: { clearingAccountId } }).then((r) => r.data),
  create: (input: MarginValuationInput) =>
    apiClient.post<MarginValuation>('/credit/margin-valuations', input).then((r) => r.data),
  update: (id: number, input: MarginValuationInput) =>
    apiClient.put<MarginValuation>(`/credit/margin-valuations/${id}`, input).then((r) => r.data),
};
