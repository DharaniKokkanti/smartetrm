import type { AppModule, AppFunction, UserRole, UserRoleInput, UserRoleAssignment } from './types';

const BASE = '/api/v1';

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json() as Promise<T>;
}

// ── Modules ───────────────────────────────────────────────────────────────────
export async function fetchModules(): Promise<AppModule[]> {
  return json(await fetch(`${BASE}/app-modules`));
}

// ── Functions ─────────────────────────────────────────────────────────────────
export async function fetchFunctions(): Promise<AppFunction[]> {
  return json(await fetch(`${BASE}/app-functions`));
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export async function fetchRoles(): Promise<UserRole[]> {
  return json(await fetch(`${BASE}/roles`));
}

export async function fetchRole(id: number): Promise<UserRole> {
  return json(await fetch(`${BASE}/roles/${id}`));
}

export async function createRole(input: UserRoleInput): Promise<UserRole> {
  return json(await fetch(`${BASE}/roles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }));
}

export async function updateRole(id: number, input: UserRoleInput): Promise<UserRole> {
  return json(await fetch(`${BASE}/roles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  }));
}

export async function submitRole(id: number): Promise<UserRole> {
  return json(await fetch(`${BASE}/roles/${id}/submit`, { method: 'PATCH' }));
}

export async function approveRole(id: number): Promise<UserRole> {
  return json(await fetch(`${BASE}/roles/${id}/approve`, { method: 'PATCH' }));
}

export async function rejectRole(id: number, reason: string): Promise<UserRole> {
  return json(await fetch(`${BASE}/roles/${id}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }));
}

// ── Assignments ───────────────────────────────────────────────────────────────
export async function fetchAllAssignments(): Promise<UserRoleAssignment[]> {
  return json(await fetch(`${BASE}/role-assignments`));
}

export async function fetchUserAssignments(userId: number): Promise<UserRoleAssignment[]> {
  return json(await fetch(`${BASE}/users/${userId}/role-assignments`));
}

export async function assignRole(userId: number, roleId: number): Promise<UserRoleAssignment> {
  return json(await fetch(`${BASE}/users/${userId}/role-assignments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleId }),
  }));
}

export async function approveAssignment(assignmentId: number): Promise<UserRoleAssignment> {
  return json(await fetch(`${BASE}/role-assignments/${assignmentId}/approve`, { method: 'PATCH' }));
}

export async function rejectAssignment(assignmentId: number, reason: string): Promise<UserRoleAssignment> {
  return json(await fetch(`${BASE}/role-assignments/${assignmentId}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  }));
}

export async function revokeAssignment(userId: number, assignmentId: number): Promise<void> {
  await fetch(`${BASE}/users/${userId}/role-assignments/${assignmentId}`, { method: 'DELETE' });
}
