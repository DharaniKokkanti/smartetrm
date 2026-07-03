import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { uomConversionApi } from './api';
import type { UomConversionInput } from './types';
import type { ProblemDetail } from '@services/api';
import type { CommodityType } from '@features/organization/desks/types';

export function useUomConversions(commodityType?: CommodityType | null) {
  return useQuery({
    queryKey: ['uom-conversions', commodityType ?? 'ALL'],
    queryFn: () => uomConversionApi.list(commodityType),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSaveUomConversion() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: UomConversionInput }) =>
      id === null ? uomConversionApi.create(input) : uomConversionApi.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['uom-conversions'] });
      message.success('Conversion rate saved.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteUomConversion() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => uomConversionApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['uom-conversions'] });
      message.success('Conversion rate deleted.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Delete failed.'),
  });
}
