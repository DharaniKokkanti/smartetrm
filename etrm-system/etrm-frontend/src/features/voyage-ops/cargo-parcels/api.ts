import { apiClient } from '@services/api';
import type { VoyageCargoParcel, VoyageCargoParcelInput } from './types';

export const cargoParcelsApi = {
  list: (voyageId?: number) => apiClient.get<VoyageCargoParcel[]>('/voyage-ops/cargo-parcels', { params: { voyageId } }).then((r) => r.data),
  create: (input: VoyageCargoParcelInput) => apiClient.post<VoyageCargoParcel>('/voyage-ops/cargo-parcels', input).then((r) => r.data),
  update: (id: number, input: VoyageCargoParcelInput) =>
    apiClient.put<VoyageCargoParcel>(`/voyage-ops/cargo-parcels/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/voyage-ops/cargo-parcels/${id}/deactivate`),
};
