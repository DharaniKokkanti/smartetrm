import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchModules, fetchFunctions,
  fetchRoles, fetchRole, createRole, updateRole,
  submitRole, approveRole, rejectRole,
  fetchAllAssignments, assignRole, approveAssignment, rejectAssignment, revokeAssignment,
} from './api';
import type { UserRoleInput } from './types';

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
  return useMutation({
    mutationFn: (input: UserRoleInput) => createRole(input),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
  });
}

export function useUpdateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UserRoleInput }) => updateRole(id, input),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
  });
}

export function useSubmitRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => submitRole(id),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
  });
}

export function useApproveRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveRole(id),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
  });
}

export function useRejectRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => rejectRole(id, reason),
    onSuccess: () => qc.invalidateQueries(rolesKey()),
  });
}

// ── Assignments ───────────────────────────────────────────────────────────────
export function useAssignments() {
  return useQuery({ queryKey: ['role-assignments'], queryFn: fetchAllAssignments });
}

export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => assignRole(userId, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-assignments'] }),
  });
}

export function useApproveAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: number) => approveAssignment(assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-assignments'] }),
  });
}

export function useRejectAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ assignmentId, reason }: { assignmentId: number; reason: string }) =>
      rejectAssignment(assignmentId, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-assignments'] }),
  });
}

export function useRevokeAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, assignmentId }: { userId: number; assignmentId: number }) =>
      revokeAssignment(userId, assignmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-assignments'] }),
  });
}
