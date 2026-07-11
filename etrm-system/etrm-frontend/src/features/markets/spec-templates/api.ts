import { apiClient } from '@services/api';
import type { ProductSpecTemplate, ProductSpecTemplateInput } from './types';

export const specTemplatesApi = {
  list: () => apiClient.get<ProductSpecTemplate[]>('/markets/spec-templates').then((r) => r.data),
  create: (input: ProductSpecTemplateInput) => apiClient.post<ProductSpecTemplate>('/markets/spec-templates', input).then((r) => r.data),
  update: (id: number, input: ProductSpecTemplateInput) => apiClient.put<ProductSpecTemplate>(`/markets/spec-templates/${id}`, input).then((r) => r.data),
};
