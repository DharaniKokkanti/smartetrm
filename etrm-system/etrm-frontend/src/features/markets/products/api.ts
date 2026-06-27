import { apiClient } from '@services/api';
import type { Product, ProductInput } from './types';

export const productsApi = {
  list: () => apiClient.get<Product[]>('/products').then((r) => r.data),
  create: (input: ProductInput) => apiClient.post<Product>('/products', input).then((r) => r.data),
  update: (id: number, input: ProductInput) => apiClient.put<Product>(`/products/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/products/${id}/deactivate`),
};
