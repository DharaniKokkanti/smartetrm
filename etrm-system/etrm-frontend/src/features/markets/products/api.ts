import { apiClient } from '@services/api';
import type {
  Product, ProductInput,
  ProductPriceIndex, ProductPriceIndexInput, ProductMarketLink,
  ProductSpecTemplate, ProductSpecValue,
  BlendComponent, BlendComponentInput,
  SpecParameter,
  ProductReportingGroup, ProductReportingGroupInput,
} from './types';
import type { CommodityType } from '@features/organization/desks/types';

export const productsApi = {
  list:       () => apiClient.get<Product[]>('/products').then((r) => r.data),
  create:     (input: ProductInput) => apiClient.post<Product>('/products', input).then((r) => r.data),
  update:     (id: number, input: ProductInput) => apiClient.put<Product>(`/products/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/products/${id}/deactivate`),
};

export const productIndexApi = {
  list:   (productId: number) =>
    apiClient.get<ProductPriceIndex[]>(`/products/${productId}/price-indices`).then((r) => r.data),
  link:   (productId: number, input: ProductPriceIndexInput) =>
    apiClient.post<ProductPriceIndex>(`/products/${productId}/price-indices`, input).then((r) => r.data),
  unlink: (productId: number, productIndexId: number) =>
    apiClient.delete(`/products/${productId}/price-indices/${productIndexId}`),
};

export const productMarketApi = {
  list: (productId: number) =>
    apiClient.get<ProductMarketLink[]>(`/products/${productId}/markets`).then((r) => r.data),
};

export const productSpecApi = {
  listTemplates: (productId: number) =>
    apiClient.get<ProductSpecTemplate[]>(`/products/${productId}/spec-templates`).then((r) => r.data),
  createTemplate: (productId: number, input: Omit<ProductSpecTemplate, 'templateId' | 'productId' | 'createdAt'>) =>
    apiClient.post<ProductSpecTemplate>(`/products/${productId}/spec-templates`, input).then((r) => r.data),
  getValues: (templateId: number) =>
    apiClient.get<ProductSpecValue[]>(`/spec-templates/${templateId}/values`).then((r) => r.data),
  addValue: (templateId: number, input: Omit<ProductSpecValue, 'specValueId'>) =>
    apiClient.post<ProductSpecValue>(`/spec-templates/${templateId}/values`, input).then((r) => r.data),
  updateValue: (templateId: number, specValueId: number, input: Partial<Omit<ProductSpecValue, 'specValueId'>>) =>
    apiClient.put<ProductSpecValue>(`/spec-templates/${templateId}/values/${specValueId}`, input).then((r) => r.data),
  deleteValue: (templateId: number, specValueId: number) =>
    apiClient.delete(`/spec-templates/${templateId}/values/${specValueId}`),
  listParameters: (commodityType?: CommodityType) =>
    apiClient.get<SpecParameter[]>('/spec-parameters', { params: commodityType ? { commodityType } : {} }).then((r) => r.data),
};

export const productBlendApi = {
  listComponents: (productId: number) =>
    apiClient.get<BlendComponent[]>(`/products/${productId}/blend-components`).then((r) => r.data),
  addComponent: (productId: number, input: BlendComponentInput) =>
    apiClient.post<BlendComponent>(`/products/${productId}/blend-components`, input).then((r) => r.data),
  removeComponent: (productId: number, blendComponentId: number) =>
    apiClient.delete(`/products/${productId}/blend-components/${blendComponentId}`),
};

export const productReportingGroupApi = {
  list: (productId: number) =>
    apiClient.get<ProductReportingGroup[]>(`/products/${productId}/reporting-groups`).then((r) => r.data),
  assign: (productId: number, input: ProductReportingGroupInput) =>
    apiClient.post<ProductReportingGroup>(`/products/${productId}/reporting-groups`, input).then((r) => r.data),
  remove: (productId: number, productReportingGroupId: number) =>
    apiClient.delete(`/products/${productId}/reporting-groups/${productReportingGroupId}`),
};
