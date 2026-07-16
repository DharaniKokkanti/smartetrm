import { useQuery } from '@tanstack/react-query';
import { bunkerRobLedgerApi } from './api';

export function useBunkerRobLedger(params?: { vesselId?: number; fuelGradeId?: number }) {
  return useQuery({ queryKey: ['bunker-rob-ledger', params], queryFn: () => bunkerRobLedgerApi.list(params), staleTime: 30 * 1000 });
}
