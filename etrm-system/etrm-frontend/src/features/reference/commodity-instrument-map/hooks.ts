import { useQuery } from '@tanstack/react-query';
import { commodityInstrumentMapApi } from './api';

// staleTime: Infinity — this is vendor-controlled config; only changes via DB migration
export function useCommodityInstrumentMap() {
  return useQuery({
    queryKey: ['commodity-instrument-map'],
    queryFn: commodityInstrumentMapApi.get,
    staleTime: Infinity,
  });
}
