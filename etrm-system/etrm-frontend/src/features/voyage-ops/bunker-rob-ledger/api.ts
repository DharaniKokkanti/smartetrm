import { apiClient } from '@services/api';
import type { VesselBunkerRobLedgerEntry } from './types';

export const bunkerRobLedgerApi = {
  list: (params?: { vesselId?: number; fuelGradeId?: number }) =>
    apiClient.get<VesselBunkerRobLedgerEntry[]>('/voyage-ops/bunker-rob-ledger', { params }).then((r) => r.data),
};
