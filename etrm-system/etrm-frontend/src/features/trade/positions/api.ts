import { apiClient } from '@services/api';
import type { Position } from './types';
import type { CommodityType } from '@features/organization/desks/types';

export const positionsApi = {
  list: (params?: { commodityType?: CommodityType; bookId?: number; periodCode?: string }) =>
    apiClient.get<Position[]>('/positions', { params }).then((r) => r.data),
};
