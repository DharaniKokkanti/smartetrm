import { apiClient } from '@services/api';
import type { Collateral, CollateralInput } from './types';

export const collateralApi = {
  list: () => apiClient.get<Collateral[]>('/credit/collateral').then((r) => r.data),
  create: (input: CollateralInput) => apiClient.post<Collateral>('/credit/collateral', input).then((r) => r.data),
  update: (id: number, input: CollateralInput) => apiClient.put<Collateral>(`/credit/collateral/${id}`, input).then((r) => r.data),
};
