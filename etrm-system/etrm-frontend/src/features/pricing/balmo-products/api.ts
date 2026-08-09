import type { BalmoProduct, BalmoProductInput } from './types';
import { apiClient } from '@services/api';

// No real backend controller exists for this yet (flagged, deliberately
// deferred — BOLMO is out of Master Data scope, see handoff doc). Fixed
// here to at least use apiClient (was raw fetch(), no auth header) and the
// correct /balmo-products path (was missing relative to apiClient's
// /api/v1 baseURL, and didn't match the MSW mock's registered path either)
// so this works correctly under mocks and will work once the backend lands.
const BASE = '/balmo-products';

export const balmoProductsApi = {
  list: (): Promise<BalmoProduct[]> =>
    apiClient.get<BalmoProduct[]>(BASE).then((r) => r.data),

  create: (input: BalmoProductInput): Promise<BalmoProduct> =>
    apiClient.post<BalmoProduct>(BASE, input).then((r) => r.data),

  update: (id: number, input: BalmoProductInput): Promise<BalmoProduct> =>
    apiClient.put<BalmoProduct>(`${BASE}/${id}`, input).then((r) => r.data),
};
