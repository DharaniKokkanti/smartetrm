import { useQuery } from '@tanstack/react-query';
import { fetchEffectiveFieldPermissions } from './api';
import type { AccessLevel, FieldPermissionMap, ObjectLockParams } from './types';

const STALE_MS = 60_000; // 1 minute — matches backend cache TTL

const FULL_EDIT: FieldPermissionMap = {};

/**
 * Resolves the effective field permissions for the current user on a given
 * screen, incorporating both Layer 1 lifecycle locks and Layer 2 role config.
 *
 * While loading, all fields default to EDIT (optimistic — prevents flicker
 * from prematurely hiding/disabling fields on open).
 *
 * @param screenCode  e.g. 'TRADE_BLOTTER'
 * @param lockParams  optional object state (trade status, hasInvoice, etc.)
 *                    to include Layer 1 evaluation. Omit for new records.
 */
export function useFieldPermissions(screenCode: string, lockParams?: ObjectLockParams) {
  const queryKey = ['field-permissions', screenCode, lockParams] as const;

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchEffectiveFieldPermissions(screenCode, lockParams),
    staleTime: STALE_MS,
    // Don't refetch on window focus — permissions change only on admin save
    refetchOnWindowFocus: false,
  });

  const permissions: FieldPermissionMap = data?.permissions ?? FULL_EDIT;
  const lockedFields = data?.lockedFields ?? {};

  function can(fieldKey: string, level: AccessLevel): boolean {
    const effective = permissions[fieldKey] ?? 'EDIT';
    if (level === 'HIDDEN') return effective === 'HIDDEN';
    if (level === 'VIEW')   return effective !== 'EDIT';
    if (level === 'EDIT')   return effective === 'EDIT';
    return true;
  }

  return {
    permissions,
    lockedFields,
    fieldRegistry: data?.fieldRegistry ?? [],
    isLoading,
    isError,

    /** true only if the field is EDIT and not locked */
    canEdit:  (fieldKey: string) => (permissions[fieldKey] ?? 'EDIT') === 'EDIT',

    /** true if the field is visible (EDIT or VIEW) */
    canView:  (fieldKey: string) => (permissions[fieldKey] ?? 'EDIT') !== 'HIDDEN',

    /** true if the field is completely hidden */
    isHidden: (fieldKey: string) => (permissions[fieldKey] ?? 'EDIT') === 'HIDDEN',

    /** Lock reason string if this field is Layer 1 locked, else undefined */
    lockReason: (fieldKey: string) => lockedFields[fieldKey] as string | undefined,

    can,
  };
}

export type UseFieldPermissionsReturn = ReturnType<typeof useFieldPermissions>;
