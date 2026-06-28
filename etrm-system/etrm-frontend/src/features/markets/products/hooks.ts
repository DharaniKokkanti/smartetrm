import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { productsApi, productIndexApi, productMarketApi, productSpecApi, productBlendApi, uomConversionApi } from './api';
import type { ProductInput, ProductPriceIndexInput, BlendComponentInput, UomConversionInput } from './types';
import type { ProblemDetail } from '@services/api';
import type { CommodityType } from '@features/organization/desks/types';

const KEY = ['products'] as const;

export function useProducts() {
  return useQuery({ queryKey: KEY, queryFn: productsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveProduct() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: ProductInput }) =>
      id === null ? productsApi.create(input) : productsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Product "${d.productCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateProduct() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: productsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Product deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

// ── Price index links ─────────────────────────────────────────────────────────

export function useProductPriceIndices(productId: number | null) {
  return useQuery({
    queryKey: ['products', productId, 'price-indices'],
    queryFn: () => productIndexApi.list(productId!),
    enabled: productId !== null,
  });
}

export function useLinkPriceIndex(productId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: ProductPriceIndexInput) => productIndexApi.link(productId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'price-indices'] });
      message.success('Price index linked.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Link failed.'),
  });
}

export function useUnlinkPriceIndex(productId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (productIndexId: number) => productIndexApi.unlink(productId, productIndexId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'price-indices'] });
      message.success('Price index unlinked.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Unlink failed.'),
  });
}

// ── Market links ──────────────────────────────────────────────────────────────

export function useProductMarkets(productId: number | null) {
  return useQuery({
    queryKey: ['products', productId, 'markets'],
    queryFn: () => productMarketApi.list(productId!),
    enabled: productId !== null,
  });
}

// ── Quality spec templates ─────────────────────────────────────────────────────

export function useProductSpecTemplates(productId: number | null) {
  return useQuery({
    queryKey: ['products', productId, 'spec-templates'],
    queryFn: () => productSpecApi.listTemplates(productId!),
    enabled: productId !== null,
  });
}

export function useSpecValues(templateId: number | null) {
  return useQuery({
    queryKey: ['spec-templates', templateId, 'values'],
    queryFn: () => productSpecApi.getValues(templateId!),
    enabled: templateId !== null,
  });
}

export function useAddSpecValue(templateId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: Omit<import('./types').ProductSpecValue, 'specValueId'>) =>
      productSpecApi.addValue(templateId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spec-templates', templateId, 'values'] });
      message.success('Spec value added.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Failed.'),
  });
}

export function useUpdateSpecValue(templateId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ specValueId, input }: { specValueId: number; input: Partial<Omit<import('./types').ProductSpecValue, 'specValueId'>> }) =>
      productSpecApi.updateValue(templateId, specValueId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spec-templates', templateId, 'values'] });
      message.success('Spec value updated.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Failed.'),
  });
}

export function useDeleteSpecValue(templateId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (specValueId: number) => productSpecApi.deleteValue(templateId, specValueId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spec-templates', templateId, 'values'] });
      message.success('Spec value removed.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Failed.'),
  });
}

export function useSpecParameters(commodityType?: CommodityType) {
  return useQuery({
    queryKey: ['spec-parameters', commodityType ?? 'ALL'],
    queryFn: () => productSpecApi.listParameters(commodityType),
    staleTime: 10 * 60 * 1000,
  });
}

// ── Blend components ───────────────────────────────────────────────────────────

export function useProductBlendComponents(productId: number | null) {
  return useQuery({
    queryKey: ['products', productId, 'blend-components'],
    queryFn: () => productBlendApi.listComponents(productId!),
    enabled: productId !== null,
  });
}

export function useAddBlendComponent(productId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: BlendComponentInput) => productBlendApi.addComponent(productId, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'blend-components'] });
      message.success('Blend component added.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Failed.'),
  });
}

export function useRemoveBlendComponent(productId: number) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (blendComponentId: number) => productBlendApi.removeComponent(productId, blendComponentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products', productId, 'blend-components'] });
      message.success('Component removed.');
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Failed.'),
  });
}

// ── UoM Conversions ───────────────────────────────────────────────────────────

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
