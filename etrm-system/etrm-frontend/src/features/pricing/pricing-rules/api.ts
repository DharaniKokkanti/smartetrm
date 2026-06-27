import { apiClient } from '@services/api';
import type { PricingRule, PricingRuleInput } from './types';

export const pricingRulesApi = {
  list: () => apiClient.get<PricingRule[]>('/pricing-rules').then((r) => r.data),
  create: (input: PricingRuleInput) => apiClient.post<PricingRule>('/pricing-rules', input).then((r) => r.data),
  update: (id: number, input: PricingRuleInput) => apiClient.put<PricingRule>(`/pricing-rules/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/pricing-rules/${id}/deactivate`),
};
