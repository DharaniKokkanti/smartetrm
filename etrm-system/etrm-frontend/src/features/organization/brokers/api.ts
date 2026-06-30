import { apiClient } from '@services/api';
import type { Broker, BrokerInput } from './types';

export const brokersApi = {
  list: () => apiClient.get<Broker[]>('/brokers').then((r) => r.data),
  create: (input: BrokerInput) => apiClient.post<Broker>('/brokers', input).then((r) => r.data),
  update: (id: number, input: BrokerInput) => apiClient.put<Broker>(`/brokers/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/brokers/${id}/deactivate`),
};
