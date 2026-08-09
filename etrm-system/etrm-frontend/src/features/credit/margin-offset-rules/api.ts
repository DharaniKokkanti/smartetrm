import { apiClient } from '@services/api';
import type { MarginOffsetRule, MarginOffsetRuleInput } from './types';

export interface MarketProductLinkOption {
  marketProductLinkId: number;
  ticker: string | null;
}

export const marketProductLinksApi = {
  listAll: () => apiClient.get<MarketProductLinkOption[]>('/market-product-links').then((r) => r.data),
};

export const marginOffsetRulesApi = {
  list: (exchangeId: number) =>
    apiClient.get<MarginOffsetRule[]>('/credit/margin-offset-rules', { params: { exchangeId } }).then((r) => r.data),
  create: (input: MarginOffsetRuleInput) =>
    apiClient.post<MarginOffsetRule>('/credit/margin-offset-rules', input).then((r) => r.data),
  update: (id: number, input: MarginOffsetRuleInput) =>
    apiClient.put<MarginOffsetRule>(`/credit/margin-offset-rules/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/credit/margin-offset-rules/${id}/deactivate`),
};
