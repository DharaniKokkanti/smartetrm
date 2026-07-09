import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import {
  fetchModules, fetchFunctions,
  fetchRoles, fetchRole, createRole, updateRole,
  submitRole, approveRole, rejectRole,
  fetchAllAssignments, assignRole, approveAssignment, rejectAssignment, revokeAssignment,
} from './api';
import type { UserRoleInput } from './types';
import type { ProblemDetail } from '@services/api';

// ── Static reference ──────────────────────────────────────────────────────────
export function useModules() {
  return useQuery({ queryKey: ['app-modules'], queryFn: fetchModules, staleTime: Infinity });
}

export function useFunctions() {
  return useQuery({ queryKey: ['app-functions'], queryFn: fetchFunctions, staleTime: Infinity });
}

// ── Roles ─────────────────────────────────────────────────────────────────────
export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: fetchRoles });
}

export function useRoleDetail(id: number | null) {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => fetchRole(id!),
    enabled: id !== null,
  });
}

function rolesKey() { return { queryKey: ['roles'] }; }

export function useCreateRole() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: UserRoleInput) => createRole(input),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Create role failed.'),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UserRoleInput }) => updateRole(id, input),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Update role failed.'),
  });
}

export function useSubmitRole() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => submitRole(id),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Submit failed.'),
  });
}

export function useApproveRole() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => approveRole(id),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Approve failed.'),
  });
}

export function useRejectRole() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectRole(id, reason),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Reject failed.'),
  });
}

// ── Assignments ───────────────────────────────────────────────────────────────
export function useAssignments() {
  return useQuery({ queryKey: ['role-assignments'], queryFn: fetchAllAssignments });
}

export function useAssignRole() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => assignRole(userId, roleId),
    // V79 follow-up: System Users' Role column denormalizes from these same
    // assignment rows now (mocks/etrmHandlers.ts's denormalizeSystemUser) —
    // invalidate its query key too, or an approval/rejection/revocation here
    // leaves the Users grid showing a stale role/status until its own 5-
    // minute staleTime lapses.
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['role-assignments'] }); qc.invalidateQueries({ queryKey: ['system-users'] }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Assign role failed.'),
  });
}

export function useApproveAssignment() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (assignmentId: number) => approveAssignment(assignmentId),
    // V79 follow-up: System Users' Role column denormalizes from these same
    // assignment rows now (mocks/etrmHandlers.ts's denormalizeSystemUser) —
    // invalidate its query key too, or an approval/rejection/revocation here
    // leaves the Users grid showing a stale role/status until its own 5-
    // minute staleTime lapses.
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['role-assignments'] }); qc.invalidateQueries({ queryKey: ['system-users'] }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Approve failed.'),
  });
}

export function useRejectAssignment() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: number; reason: string }) =>
      rejectAssignment(assignmentId, reason),
    // V79 follow-up: System Users' Role column denormalizes from these same
    // assignment rows now (mocks/etrmHandlers.ts's denormalizeSystemUser) —
    // invalidate its query key too, or an approval/rejection/revocation here
    // leaves the Users grid showing a stale role/status until its own 5-
    // minute staleTime lapses.
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['role-assignments'] }); qc.invalidateQueries({ queryKey: ['system-users'] }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Reject failed.'),
  });
}

export function useRevokeAssignment() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ userId, assignmentId }: { userId: number; assignmentId: number }) =>
      revokeAssignment(userId, assignmentId),
    // V79 follow-up: System Users' Role column denormalizes from these same
    // assignment rows now (mocks/etrmHandlers.ts's denormalizeSystemUser) —
    // invalidate its query key too, or an approval/rejection/revocation here
    // leaves the Users grid showing a stale role/status until its own 5-
    // minute staleTime lapses.
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['role-assignments'] }); qc.invalidateQueries({ queryKey: ['system-users'] }); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Revoke failed.'),
  });
}
