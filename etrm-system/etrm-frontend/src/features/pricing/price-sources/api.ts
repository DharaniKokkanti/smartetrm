import { apiClient } from '@services/api';
import type { PriceSource, PriceSourceInput, PriceIndexSource, PriceIndexSourceInput } from './types';

export const priceSourcesApi = {
  list: () => apiClient.get<PriceSource[]>('/price-sources').then((r) => r.data),
  create: (input: PriceSourceInput) => apiClient.post<PriceSource>('/price-sources', input).then((r) => r.data),
  update: (id: number, input: PriceSourceInput) => apiClient.put<PriceSource>(`/price-sources/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/price-sources/${id}/deactivate`),

  // Price Index → Source links (sub-resource on price-source)
  listIndexLinks: (priceSourceId: number) => apiClient.get<PriceIndexSource[]>(`/price-sources/${priceSourceId}/index-links`).then((r) => r.data),
  addIndexLink: (input: PriceIndexSourceInput) => apiClient.post<PriceIndexSource>('/price-index-sources', input).then((r) => r.data),
  updateIndexLink: (id: number, input: Partial<PriceIndexSourceInput>) => apiClient.put<PriceIndexSource>(`/price-index-sources/${id}`, input).then((r) => r.data),
  removeIndexLink: (id: number) => apiClient.patch(`/price-index-sources/${id}/deactivate`),

  // All index-source links (for the standalone view)
  listAllIndexSources: () => apiClient.get<PriceIndexSource[]>('/price-index-sources').then((r) => r.data),
};
