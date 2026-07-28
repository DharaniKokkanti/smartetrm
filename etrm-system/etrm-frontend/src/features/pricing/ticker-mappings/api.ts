import { apiClient } from '@services/api';
import type { TickerMapping, TickerMappingInput } from './types';

export const tickerMappingsApi = {
  list: () => apiClient.get<TickerMapping[]>('/ticker-mappings').then((r) => r.data),
  create: (input: TickerMappingInput) => apiClient.post<TickerMapping>('/ticker-mappings', input).then((r) => r.data),
  update: (id: number, input: TickerMappingInput) => apiClient.put<TickerMapping>(`/ticker-mappings/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/ticker-mappings/${id}/deactivate`),
};
