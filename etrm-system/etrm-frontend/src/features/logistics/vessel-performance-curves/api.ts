import { apiClient } from '@services/api';
import type { VesselPerformanceCurve, VesselPerformanceCurveInput } from './types';

export const vesselPerformanceCurvesApi = {
  list: (vesselId?: number) =>
    apiClient.get<VesselPerformanceCurve[]>('/logistics/vessel-performance-curves', { params: { vesselId } }).then((r) => r.data),
  create: (input: VesselPerformanceCurveInput) =>
    apiClient.post<VesselPerformanceCurve>('/logistics/vessel-performance-curves', input).then((r) => r.data),
  update: (id: number, input: VesselPerformanceCurveInput) =>
    apiClient.put<VesselPerformanceCurve>(`/logistics/vessel-performance-curves/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/vessel-performance-curves/${id}/deactivate`),
};
