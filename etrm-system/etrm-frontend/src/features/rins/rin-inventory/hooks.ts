import { useQuery } from '@tanstack/react-query';
import { rinInventoryApi } from './api';

const KEY = ['rin-inventory'] as const;

export function useRinInventory() {
  return useQuery({ queryKey: KEY, queryFn: rinInventoryApi.list, staleTime: 60 * 1000 });
}
