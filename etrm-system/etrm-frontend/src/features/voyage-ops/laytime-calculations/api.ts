import { apiClient } from '@services/api';
import type { LaytimeCalculation, LaytimeCalculationInput } from './types';

export const laytimeCalculationsApi = {
  list: (voyageId?: number) =>
    apiClient.get<LaytimeCalculation[]>('/voyage-ops/laytime-calculations', { params: { voyageId } }).then((r) => r.data),
  create: (input: LaytimeCalculationInput) =>
    apiClient.post<LaytimeCalculation>('/voyage-ops/laytime-calculations', input).then((r) => r.data),
};
