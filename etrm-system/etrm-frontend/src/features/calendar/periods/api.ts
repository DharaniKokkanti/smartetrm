import { apiClient } from '@services/api';
import type { AutoGenerateRequest, MarketProductLinkOption, Period, PeriodBulkResult, PeriodInput } from './types';

export const periodsApi = {
  list: () => apiClient.get<Period[]>('/periods').then((r) => r.data),
  create: (input: PeriodInput) => apiClient.post<Period>('/periods', input).then((r) => r.data),
  update: (id: number, input: PeriodInput) => apiClient.put<Period>(`/periods/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/periods/${id}/deactivate`),
  bulkCreate: (periods: PeriodInput[]) => apiClient.post<PeriodBulkResult>('/periods/bulk', { periods }).then((r) => r.data),
  autoGenerate: (request: AutoGenerateRequest) => apiClient.post<Period[]>('/periods/auto-generate', request).then((r) => r.data),
  listMarketProductLinks: () => apiClient.get<MarketProductLinkOption[]>('/market-product-links').then((r) => r.data),
};
