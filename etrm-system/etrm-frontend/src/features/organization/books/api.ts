import { apiClient } from '@services/api';
import type { Book, BookClassificationDimension, BookClassificationView, BookInput, BookTraderView } from './types';

export const booksApi = {
  list: () => apiClient.get<Book[]>('/books').then((r) => r.data),
  get: (id: number) => apiClient.get<Book>(`/books/${id}`).then((r) => r.data),
  create: (input: BookInput) => apiClient.post<Book>('/books', input).then((r) => r.data),
  update: (id: number, input: BookInput) => apiClient.put<Book>(`/books/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/books/${id}/deactivate`),
  archive: (id: number, reason: string) => apiClient.patch<Book>(`/books/${id}/archive`, { reason }).then((r) => r.data),
  move: (id: number, body: { legalEntityId: number; deskId: number | null; parentBookId: number | null }) =>
    apiClient.patch<Book>(`/books/${id}/move`, body).then((r) => r.data),
  descendants: (id: number) => apiClient.get<Book[]>(`/books/${id}/descendants`).then((r) => r.data),
  listTraders: (bookId: number) => apiClient.get<BookTraderView[]>(`/books/${bookId}/traders`).then((r) => r.data),
  addTrader: (bookId: number, body: { traderId: number; role: string }) =>
    apiClient.post(`/books/${bookId}/traders`, body),
  removeTrader: (bookId: number, traderId: number) =>
    apiClient.delete(`/books/${bookId}/traders/${traderId}`),
  listClassifications: (bookId: number) =>
    apiClient.get<BookClassificationView[]>(`/books/${bookId}/classifications`).then((r) => r.data),
  addClassification: (bookId: number, body: { dimensionCode: string; valueCode: string; valueLabel?: string | null }) =>
    apiClient.post(`/books/${bookId}/classifications`, body),
  removeClassification: (bookId: number, bookClassificationId: number) =>
    apiClient.delete(`/books/${bookId}/classifications/${bookClassificationId}`),
  listClassificationDimensions: () =>
    apiClient.get<BookClassificationDimension[]>('/book-classification-dimensions').then((r) => r.data),
};
