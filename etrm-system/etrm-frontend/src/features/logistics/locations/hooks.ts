import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { locationsApi } from './api';
import type { LocationInput, LocationRoleAssignmentInput } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const KEY = ['locations'] as const;

export function useLocations() {
  return useQuery({ queryKey: KEY, queryFn: locationsApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveLocation() {
  const qc = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: LocationInput }) =>
      id === null ? locationsApi.create(input) : locationsApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Location "${d.locationCode}" saved.`); },
    onError: (e: ProblemDetail) => {
      if (isOptimisticLockConflict(e)) showOptimisticLockConflict(notification);
      else message.error(e.detail ?? e.title ?? 'Save failed.');
    },
  });
}

export function useTradingDeskLocations() {
  return useQuery({ queryKey: ['locations', 'trading-desks'], queryFn: locationsApi.listTradingDesks, staleTime: 5 * 60 * 1000 });
}

export function useDeactivateLocation() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: locationsApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Location deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

export function useLocationRoles(locationId: number | null) {
  return useQuery({
    queryKey: ['locations', locationId, 'roles'],
    queryFn: () => locationsApi.roles.list(locationId as number),
    enabled: locationId !== null,
  });
}

export function useSaveLocationRole(locationId: number | null) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: LocationRoleAssignmentInput) => locationsApi.roles.create(locationId as number, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations', locationId, 'roles'] }); message.success('Role added.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeleteLocationRole(locationId: number | null) {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (roleId: number) => locationsApi.roles.remove(locationId as number, roleId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['locations', locationId, 'roles'] }); message.success('Role removed.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Remove failed.'),
  });
}
