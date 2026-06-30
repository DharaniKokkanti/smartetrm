import { apiClient } from '@services/api';
import type { BrokerFeeAgreement, BrokerFeeAgreementInput } from './types';

export const bfaApi = {
  list: () => apiClient.get<BrokerFeeAgreement[]>('/broker-fee-agreements').then((r) => r.data),
  create: (input: BrokerFeeAgreementInput) =>
    apiClient.post<BrokerFeeAgreement>('/broker-fee-agreements', input).then((r) => r.data),
  update: (id: number, input: BrokerFeeAgreementInput) =>
    apiClient.put<BrokerFeeAgreement>(`/broker-fee-agreements/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/broker-fee-agreements/${id}/deactivate`),
};
