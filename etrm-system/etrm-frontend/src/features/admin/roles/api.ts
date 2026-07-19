import { apiClient } from '@services/api';
import type { AppModule, AppFunction, UserRole, UserRoleInput, UserRoleAssignment, RoleFunction } from './types';

// ── Modules ───────────────────────────────────────────────────────────────────
export async function fetchModules(): Promise<AppModule[]> {
  return apiClient.get<AppModule[]>('/app-modules').then((r) => r.data);
}

// ── Functions ─────────────────────────────────────────────────────────────────
export async function fetchFunctions(): Promise<AppFunction[]> {
  return apiClient.get<AppFunction[]>('/app-functions').then((r) => r.data);
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export async function fetchRoles(): Promise<UserRole[]> {
  return apiClient.get<UserRole[]>('/roles').then((r) => r.data);
}

/** Backend returns { role, functions }, not a flat UserRole — callers only
 *  ever read .functions off this (see RoleFormModal), so the return type
 *  here is deliberately loose rather than a misleading UserRole promise. */
export async function fetchRole(id: number): Promise<{ role: UserRole; functions: RoleFunction[] }> {
  return apiClient.get(`/roles/${id}`).then((r) => r.data);
}

export async function createRole(input: UserRoleInput): Promise<UserRole> {
  return apiClient.post<UserRole>('/roles', input).then((r) => r.data);
}

export async function updateRole(id: number, input: UserRoleInput): Promise<UserRole> {
  return apiClient.put<UserRole>(`/roles/${id}`, input).then((r) => r.data);
}

export async function submitRole(id: number): Promise<UserRole> {
  return apiClient.patch<UserRole>(`/roles/${id}/submit`).then((r) => r.data);
}

export async function approveRole(id: number): Promise<UserRole> {
  return apiClient.patch<UserRole>(`/roles/${id}/approve`).then((r) => r.data);
}

export async function rejectRole(id: number, reason: string): Promise<UserRole> {
  return apiClient.patch<UserRole>(`/roles/${id}/reject`, { reason }).then((r) => r.data);
}

// ── Assignments ───────────────────────────────────────────────────────────────
export async function fetchAllAssignments(): Promise<UserRoleAssignment[]> {
  return apiClient.get<UserRoleAssignment[]>('/role-assignments').then((r) => r.data);
}

export async function fetchUserAssignments(userId: number): Promise<UserRoleAssignment[]> {
  return apiClient.get<UserRoleAssignment[]>(`/users/${userId}/role-assignments`).then((r) => r.data);
}

export async function assignRole(userId: number, roleId: number): Promise<UserRoleAssignment> {
  return apiClient.post<UserRoleAssignment>(`/users/${userId}/role-assignments`, { roleId }).then((r) => r.data);
}

export async function approveAssignment(assignmentId: number): Promise<UserRoleAssignment> {
  return apiClient.patch<UserRoleAssignment>(`/role-assignments/${assignmentId}/approve`).then((r) => r.data);
}

export async function rejectAssignment(assignmentId: number, reason: string): Promise<UserRoleAssignment> {
  return apiClient.patch<UserRoleAssignment>(`/role-assignments/${assignmentId}/reject`, { reason }).then((r) => r.data);
}

export async function revokeAssignment(userId: number, assignmentId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/role-assignments/${assignmentId}`);
}
