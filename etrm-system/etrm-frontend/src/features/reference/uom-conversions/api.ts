import { apiClient } from '@services/api';
import type { UomConversion, UomConversionInput } from './types';
import type { CommodityType } from '@features/organization/desks/types';

export const uomConversionApi = {
  list: (commodityType?: CommodityType | null) =>
    apiClient.get<UomConversion[]>('/uom-conversions', { params: commodityType ? { commodityType } : {} }).then((r) => r.data),
  create: (input: UomConversionInput) =>
    apiClient.post<UomConversion>('/uom-conversions', input).then((r) => r.data),
  update: (id: number, input: UomConversionInput) =>
    apiClient.put<UomConversion>(`/uom-conversions/${id}`, input).then((r) => r.data),
  delete: (id: number) =>
    apiClient.delete(`/uom-conversions/${id}`),
};
