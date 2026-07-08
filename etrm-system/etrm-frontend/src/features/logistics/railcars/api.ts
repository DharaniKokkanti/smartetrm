import { apiClient } from '@services/api';
import type { Railcar, RailcarInput, RailcarProductApproval, RailcarProductApprovalInput } from './types';

export const railcarsApi = {
  list: () => apiClient.get<Railcar[]>('/logistics/railcars').then((r) => r.data),
  create: (input: RailcarInput) => apiClient.post<Railcar>('/logistics/railcars', input).then((r) => r.data),
  update: (id: number, input: RailcarInput) => apiClient.put<Railcar>(`/logistics/railcars/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/logistics/railcars/${id}/deactivate`),
  listApprovedProducts: (railcarId: number) =>
    apiClient.get<RailcarProductApproval[]>(`/logistics/railcars/${railcarId}/product-approvals`).then((r) => r.data),
  createApprovedProduct: (railcarId: number, input: RailcarProductApprovalInput) =>
    apiClient.post<RailcarProductApproval>(`/logistics/railcars/${railcarId}/product-approvals`, input).then((r) => r.data),
  deleteApprovedProduct: (railcarId: number, assetApprovalId: number) =>
    apiClient.delete(`/logistics/railcars/${railcarId}/product-approvals/${assetApprovalId}`),
};
