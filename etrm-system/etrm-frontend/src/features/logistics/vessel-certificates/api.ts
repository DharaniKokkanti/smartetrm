import { apiClient } from '@services/api';
import type { VesselCertificate, VesselCertificateInput } from './types';

export const vesselCertificatesApi = {
  list: () => apiClient.get<VesselCertificate[]>('/logistics/vessel-certificates').then((r) => r.data),
  create: (input: VesselCertificateInput) => apiClient.post<VesselCertificate>('/logistics/vessel-certificates', input).then((r) => r.data),
  update: (id: number, input: VesselCertificateInput) => apiClient.put<VesselCertificate>(`/logistics/vessel-certificates/${id}`, input).then((r) => r.data),
};
