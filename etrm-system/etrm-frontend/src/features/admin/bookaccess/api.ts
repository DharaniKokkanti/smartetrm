import { apiClient } from '@services/api';
import type { BookAccessGrant, BookAccessGrantRequest } from './types';

export async function fetchAllBookAccessGrants(): Promise<BookAccessGrant[]> {
  return apiClient.get<BookAccessGrant[]>('/book-access-grants').then((r) => r.data);
}

export async function fetchUserBookAccessGrants(userId: number): Promise<BookAccessGrant[]> {
  return apiClient.get<BookAccessGrant[]>(`/users/${userId}/book-access-grants`).then((r) => r.data);
}

export async function requestBookAccessGrant(userId: number, input: BookAccessGrantRequest): Promise<BookAccessGrant> {
  return apiClient.post<BookAccessGrant>(`/users/${userId}/book-access-grants`, input).then((r) => r.data);
}

export async function approveBookAccessGrant(grantId: number): Promise<BookAccessGrant> {
  return apiClient.patch<BookAccessGrant>(`/book-access-grants/${grantId}/approve`).then((r) => r.data);
}

export async function rejectBookAccessGrant(grantId: number, reason: string): Promise<BookAccessGrant> {
  return apiClient.patch<BookAccessGrant>(`/book-access-grants/${grantId}/reject`, { reason }).then((r) => r.data);
}

export async function revokeBookAccessGrant(userId: number, grantId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/book-access-grants/${grantId}`);
}
