import { apiClient } from '@services/api';
import type { FormulaTemplate, FormulaTemplateInput } from './types';

export const formulaTemplatesApi = {
  list: () => apiClient.get<FormulaTemplate[]>('/pricing/formula-templates').then((r) => r.data),
  create: (input: FormulaTemplateInput) => apiClient.post<FormulaTemplate>('/pricing/formula-templates', input).then((r) => r.data),
  update: (id: number, input: FormulaTemplateInput) => apiClient.put<FormulaTemplate>(`/pricing/formula-templates/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/pricing/formula-templates/${id}/deactivate`),
};
