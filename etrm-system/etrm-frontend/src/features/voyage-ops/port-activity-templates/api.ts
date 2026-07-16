import { apiClient } from '@services/api';
import type { PortActivityTemplateStep, PortActivityTemplateStepInput } from './types';

export const portActivityTemplateStepsApi = {
  list: (templateId?: number) =>
    apiClient.get<PortActivityTemplateStep[]>('/voyage-ops/port-activity-template-steps', { params: { templateId } }).then((r) => r.data),
  create: (input: PortActivityTemplateStepInput) =>
    apiClient.post<PortActivityTemplateStep>('/voyage-ops/port-activity-template-steps', input).then((r) => r.data),
  update: (id: number, input: PortActivityTemplateStepInput) =>
    apiClient.put<PortActivityTemplateStep>(`/voyage-ops/port-activity-template-steps/${id}`, input).then((r) => r.data),
  delete: (id: number) => apiClient.delete(`/voyage-ops/port-activity-template-steps/${id}`),
};
