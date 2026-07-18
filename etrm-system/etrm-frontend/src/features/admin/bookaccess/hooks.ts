import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import {
  fetchAllBookAccessGrants, requestBookAccessGrant,
  approveBookAccessGrant, rejectBookAccessGrant, revokeBookAccessGrant,
} from './api';
import type { BookAccessGrantRequest } from './types';
import type { ProblemDetail } from '@services/api';

function grantsKey() { return { queryKey: ['book-access-grants'] }; }

export function useBookAccessGrants() {
  return useQuery({ queryKey: ['book-access-grants'], queryFn: fetchAllBookAccessGrants });
}

export function useRequestBookAccessGrant() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ userId, input }: { userId: number; input: BookAccessGrantRequest }) =>
      requestBookAccessGrant(userId, input),
    onSuccess: () => qc.invalidateQueries(grantsKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Request access failed.'),
  });
}

export function useApproveBookAccessGrant() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (grantId: number) => approveBookAccessGrant(grantId),
    onSuccess: () => qc.invalidateQueries(grantsKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Approve failed.'),
  });
}

export function useRejectBookAccessGrant() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ grantId, reason }: { grantId: number; reason: string }) =>
      rejectBookAccessGrant(grantId, reason),
    onSuccess: () => qc.invalidateQueries(grantsKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Reject failed.'),
  });
}

export function useRevokeBookAccessGrant() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ userId, grantId }: { userId: number; grantId: number }) =>
      revokeBookAccessGrant(userId, grantId),
    onSuccess: () => qc.invalidateQueries(grantsKey()),
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Revoke failed.'),
  });
}
