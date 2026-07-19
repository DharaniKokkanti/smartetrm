import { apiClient } from '@services/api';
import type {
  Book, BookClassificationDimension, BookClassificationView, BookEodStatus, BookInput, BookTraderView,
  BookOwnership, BookOwnershipInput, BookOwnershipListView,
} from './types';

export const booksApi = {
  list: () => apiClient.get<Book[]>('/books').then((r) => r.data),
  get: (id: number) => apiClient.get<Book>(`/books/${id}`).then((r) => r.data),
  create: (input: BookInput) => apiClient.post<Book>('/books', input).then((r) => r.data),
  update: (id: number, input: BookInput) => apiClient.put<Book>(`/books/${id}`, input).then((r) => r.data),
  deactivate: (id: number) => apiClient.patch(`/books/${id}/deactivate`),
  archive: (id: number, reason: string) => apiClient.patch<Book>(`/books/${id}/archive`, { reason }).then((r) => r.data),
  move: (id: number, body: { legalEntityId: number; parentBookId: number | null }) =>
    apiClient.patch<Book>(`/books/${id}/move`, body).then((r) => r.data),
  listEodStatus: (bookId: number) => apiClient.get<BookEodStatus[]>(`/books/${bookId}/eod-status`).then((r) => r.data),
  lockEodStatus: (bookId: number, businessDate: string) =>
    apiClient.post<BookEodStatus>(`/books/${bookId}/eod-status/lock`, { businessDate }).then((r) => r.data),
  reopenEodStatus: (bookId: number, businessDate: string, reason: string) =>
    apiClient.post<BookEodStatus>(`/books/${bookId}/eod-status/reopen`, { businessDate, reason }).then((r) => r.data),
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

  // ── book_ownership sub-resource (V126) — independent of the book's parent
  // legal_entity's own entity_type/ownership ──────────────────────────────

  listOwnership: (bookId: number) =>
    apiClient.get<BookOwnershipListView>(`/books/${bookId}/ownership`).then((r) => r.data),
  addOwnership: (bookId: number, input: BookOwnershipInput) =>
    apiClient.post<BookOwnership>(`/books/${bookId}/ownership`, input).then((r) => r.data),
  removeOwnership: (bookId: number, bookOwnershipId: number) =>
    apiClient.delete(`/books/${bookId}/ownership/${bookOwnershipId}`),
};
