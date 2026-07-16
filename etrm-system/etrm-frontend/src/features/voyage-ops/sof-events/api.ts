import { apiClient } from '@services/api';
import type { VoyageSofEvent, VoyageSofEventInput } from './types';

export const sofEventsApi = {
  list: (voyageId?: number) => apiClient.get<VoyageSofEvent[]>('/voyage-ops/sof-events', { params: { voyageId } }).then((r) => r.data),
  create: (input: VoyageSofEventInput) => apiClient.post<VoyageSofEvent>('/voyage-ops/sof-events', input).then((r) => r.data),
  update: (id: number, input: VoyageSofEventInput) => apiClient.put<VoyageSofEvent>(`/voyage-ops/sof-events/${id}`, input).then((r) => r.data),
};
