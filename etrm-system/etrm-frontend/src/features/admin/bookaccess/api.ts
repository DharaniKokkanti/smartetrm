import type { BookAccessGrant, BookAccessGrantRequest } from './types';

const BASE = '/api/v1';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchAllBookAccessGrants(): Promise<BookAccessGrant[]> {
  return json(await fetch(`${BASE}/book-access-grants`));
}

export async function fetchUserBookAccessGrants(userId: number): Promise<BookAccessGrant[]> {
  return json(await fetch(`${BASE}/users/${userId}/book-access-grants`));
}

export async function requestBookAccessGrant(userId: number, input: BookAccessGrantRequest): Promise<BookAccessGrant> {
  return json(await fetch(`${BASE}/users/${userId}/book-access-grants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }));
}

export async function approveBookAccessGrant(grantId: number): Promise<BookAccessGrant> {
  return json(await fetch(`${BASE}/book-access-grants/${grantId}/approve`, { method: 'PATCH' }));
}

export async function rejectBookAccessGrant(grantId: number, reason: string): Promise<BookAccessGrant> {
  return json(await fetch(`${BASE}/book-access-grants/${grantId}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }));
}

export async function revokeBookAccessGrant(userId: number, grantId: number): Promise<void> {
  await fetch(`${BASE}/users/${userId}/book-access-grants/${grantId}`, { method: 'DELETE' });
}
