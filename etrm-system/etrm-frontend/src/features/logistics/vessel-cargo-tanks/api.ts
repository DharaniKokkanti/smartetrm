import { apiClient } from '@services/api';
import type { VesselCargoTank, VesselCargoTankInput } from './types';

export const vesselCargoTanksApi = {
  list: (vesselId?: number) => apiClient.get<VesselCargoTank[]>('/logistics/vessel-cargo-tanks', { params: { vesselId } }).then((r) => r.data),
  create: (input: VesselCargoTankInput) => apiClient.post<VesselCargoTank>('/logistics/vessel-cargo-tanks', input).then((r) => r.data),
  update: (id: number, input: VesselCargoTankInput) => apiClient.put<VesselCargoTank>(`/logistics/vessel-cargo-tanks/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/vessel-cargo-tanks/${id}/deactivate`),
};
