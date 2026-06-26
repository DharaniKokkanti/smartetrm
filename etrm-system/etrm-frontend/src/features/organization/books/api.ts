import { apiClient } from '@services/api';
import type { Book, BookInput } from './types';

export const booksApi = {
  list: () => apiClient.get<Book[]>('/books').then((r) => r.data),
  get: (id: number) => apiClient.get<Book>(`/books/${id}`).then((r) => r.data),
  create: (input: BookInput) => apiClient.post<Book>('/books', input).then((r) => r.data),
  update: (id: number, input: BookInput) => apiClient.put<Book>(`/books/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/books/${id}/deactivate`),
};
