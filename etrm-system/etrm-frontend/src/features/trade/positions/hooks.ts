import { useQuery } from '@tanstack/react-query';
import { positionsApi } from './api';
import type { CommodityType } from '@features/organization/desks/types';

export function usePositions(params?: { commodityType?: CommodityType; bookId?: number; periodCode?: string }) {
  return useQuery({
    queryKey: ['positions', params ?? {}],
    queryFn: () => positionsApi.list(params),
    staleTime: 60 * 1000,
  });
}
