import { apiClient } from '@services/api';
import type { Market, MarketInput, MarketProductLink, MarketProductLinkInput, MarketProductPeriod, MarketProductSource } from './types';

export const marketsApi = {
  list: () => apiClient.get<Market[]>('/markets').then((r) => r.data),
  create: (input: MarketInput) => apiClient.post<Market>('/markets', input).then((r) => r.data),
  update: (id: number, input: MarketInput) => apiClient.put<Market>(`/markets/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/markets/${id}/deactivate`),

  // Market-Product-Link sub-resource
  listProductLinks: (marketId: number) => apiClient.get<MarketProductLink[]>(`/markets/${marketId}/product-links`).then((r) => r.data),
  addProductLink: (marketId: number, input: MarketProductLinkInput) => apiClient.post<MarketProductLink>(`/markets/${marketId}/product-links`, input).then((r) => r.data),
  updateProductLink: (marketId: number, linkId: number, input: MarketProductLinkInput) => apiClient.put<MarketProductLink>(`/markets/${marketId}/product-links/${linkId}`, input).then((r) => r.data),
  removeProductLink: (marketId: number, linkId: number) => apiClient.patch(`/markets/${marketId}/product-links/${linkId}/deactivate`),

  // Market-Product-Link-Period sub-resource
  listPeriods: (marketProductLinkId: number) => apiClient.get<MarketProductPeriod[]>(`/market-product-links/${marketProductLinkId}/periods`).then((r) => r.data),
  addPeriod: (marketProductLinkId: number, periodId: number) => apiClient.post(`/market-product-links/${marketProductLinkId}/periods`, { periodId }).then((r) => r.data),
  removePeriod: (mppId: number) => apiClient.patch(`/market-product-periods/${mppId}/deactivate`),

  // Market-Product-Link-Source sub-resource
  listSources: (marketProductLinkId: number) => apiClient.get<MarketProductSource[]>(`/market-product-links/${marketProductLinkId}/sources`).then((r) => r.data),
};
