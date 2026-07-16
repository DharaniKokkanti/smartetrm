import { apiClient } from '@services/api';
import type { BunkerStem, BunkerStemInput } from './types';

export const bunkerStemsApi = {
  list: (params?: { voyageId?: number; vesselId?: number }) =>
    apiClient.get<BunkerStem[]>('/voyage-ops/bunker-stems', { params }).then((r) => r.data),
  create: (input: BunkerStemInput) => apiClient.post<BunkerStem>('/voyage-ops/bunker-stems', input).then((r) => r.data),
  update: (id: number, input: BunkerStemInput) => apiClient.put<BunkerStem>(`/voyage-ops/bunker-stems/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/voyage-ops/bunker-stems/${id}/deactivate`),
};
