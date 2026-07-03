import { apiClient } from '@services/api';
import type { RinInventoryItem } from './types';

export const rinInventoryApi = {
  list: () => apiClient.get<RinInventoryItem[]>('/rin-inventory').then((r) => r.data),
};
