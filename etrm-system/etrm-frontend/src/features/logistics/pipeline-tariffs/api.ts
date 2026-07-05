import { apiClient } from '@services/api';
import type { PipelineTariff, PipelineTariffInput } from './types';

export const pipelineTariffsApi = {
  list: () => apiClient.get<PipelineTariff[]>('/logistics/pipeline-tariffs').then((r) => r.data),
  create: (input: PipelineTariffInput) => apiClient.post<PipelineTariff>('/logistics/pipeline-tariffs', input).then((r) => r.data),
  update: (id: number, input: PipelineTariffInput) => apiClient.put<PipelineTariff>(`/logistics/pipeline-tariffs/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/pipeline-tariffs/${id}/deactivate`),
};
