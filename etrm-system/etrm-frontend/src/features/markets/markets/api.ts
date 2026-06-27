import { apiClient } from '@services/api';
import type { Market, MarketInput, MarketProduct, MarketProductInput, MarketProductPeriod, MarketProductSource } from './types';

export const marketsApi = {
  list: () => apiClient.get<Market[]>('/markets').then((r) => r.data),
  create: (input: MarketInput) => apiClient.post<Market>('/markets', input).then((r) => r.data),
  update: (id: number, input: MarketInput) => apiClient.put<Market>(`/markets/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/markets/${id}/deactivate`),

  // Market-Product sub-resource
  listProducts: (marketId: number) => apiClient.get<MarketProduct[]>(`/markets/${marketId}/products`).then((r) => r.data),
  addProduct: (marketId: number, input: MarketProductInput) => apiClient.post<MarketProduct>(`/markets/${marketId}/products`, input).then((r) => r.data),
  updateProduct: (marketId: number, mpId: number, input: MarketProductInput) => apiClient.put<MarketProduct>(`/markets/${marketId}/products/${mpId}`, input).then((r) => r.data),
  removeProduct: (marketId: number, mpId: number) => apiClient.patch(`/markets/${marketId}/products/${mpId}/deactivate`),

  // Market-Product-Period sub-resource
  listPeriods: (marketProductId: number) => apiClient.get<MarketProductPeriod[]>(`/market-products/${marketProductId}/periods`).then((r) => r.data),
  addPeriod: (marketProductId: number, periodId: number) => apiClient.post(`/market-products/${marketProductId}/periods`, { periodId }).then((r) => r.data),
  removePeriod: (mppId: number) => apiClient.patch(`/market-product-periods/${mppId}/deactivate`),

  // Market-Product-Source sub-resource
  listSources: (marketProductId: number) => apiClient.get<MarketProductSource[]>(`/market-products/${marketProductId}/sources`).then((r) => r.data),
};
