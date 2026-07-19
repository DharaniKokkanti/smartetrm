import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { legalEntityApi, fetchLegalEntityChildren } from './api';
import type { LegalEntityDraft, LegalEntityInput, LegalEntityOwnershipInput } from './types';
import type { ProblemDetail } from '@services/api';
import { saveAddressAssignment, saveContactAssignment, saveTaxRegistrationAssignment } from '@features/tier1/counterparty/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

const QUERY_KEY = ['legal-entities'] as const;
const childrenKey = (id: number) => ['legal-entities', id, 'children'] as const;

export function useLegalEntities() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: legalEntityApi.list });
}

export function useLegalEntity(id: number | null) {
  return useQuery({
    queryKey: ['legal-entities', id],
    queryFn: () => legalEntityApi.get(id!),
    enabled: id !== null,
  });
}

export function useLegalEntityChildren(id: number | null) {
  return useQuery({
    queryKey: id !== null ? childrenKey(id) : ['legal-entities', 'children', 'none'],
    queryFn: () => fetchLegalEntityChildren(id!),
    enabled: id !== null,
  });
}

export function useCreateLegalEntity() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: LegalEntityInput) => legalEntityApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('Legal entity created.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Create failed.');
    },
  });
}

export function useUpdateLegalEntity() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: LegalEntityInput }) =>
      legalEntityApi.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('Legal entity updated.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Update failed.');
    },
  });
}

export function useDeactivateLegalEntity() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => legalEntityApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      message.success('Legal entity deactivated.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Deactivate failed.');
    },
  });
}

export function useBulkCreateLegalEntities() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (inputs: LegalEntityInput[]) => legalEntityApi.bulkCreate(inputs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

/** Saves the core entity plus every sub-resource section in one coordinated
 *  action — same "draft" convention as useSaveCounterpartyDraft, so
 *  LegalEntityFormPage doesn't need its own per-section save orchestration. */
export function useSaveLegalEntityDraft() {
  const queryClient = useQueryClient();
  const { message, notification } = AntApp.useApp();

  return useMutation({
    mutationFn: async ({ id, draft }: { id: number | null; draft: LegalEntityDraft }) => {
      const parent = id === null
        ? await legalEntityApi.create(draft.core)
        : await legalEntityApi.update(id, draft.core);
      const leId = parent.legalEntityId;

      const errors: string[] = [];

      for (const assignment of draft.addresses) {
        try {
          await saveAddressAssignment({ ...assignment, entityType: 'LEGAL_ENTITY', entityId: leId });
        } catch {
          errors.push(`Address "${assignment.address.addressLine1}" failed to save.`);
        }
      }

      for (const assignment of draft.contacts) {
        try {
          await saveContactAssignment({ ...assignment, entityType: 'LEGAL_ENTITY', entityId: leId });
        } catch {
          errors.push(`Contact "${assignment.contact.firstName} ${assignment.contact.lastName}" failed to save.`);
        }
      }

      for (const reg of draft.taxRegistrations) {
        try {
          await saveTaxRegistrationAssignment({ ...reg, entityType: 'LEGAL_ENTITY', entityId: leId });
        } catch {
          errors.push(`Tax registration "${reg.taxType} ${reg.taxId}" failed to save.`);
        }
      }

      return { parent, errors };
    },
    onSuccess: ({ parent, errors }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: childrenKey(parent.legalEntityId) });
      queryClient.invalidateQueries({ queryKey: ['address-pool'] });
      queryClient.invalidateQueries({ queryKey: ['contact-pool'] });
      if (errors.length === 0) {
        message.success(`Legal entity "${parent.entityCode}" saved.`);
      } else {
        message.warning(`Legal entity saved, but ${errors.length} record(s) failed: ${errors.join(' ')}`);
      }
    },
    onError: (err: ProblemDetail) => {
      if (isOptimisticLockConflict(err)) {
        showOptimisticLockConflict(notification);
      } else {
        message.error(err.detail ?? err.title ?? 'Save failed.');
      }
    },
  });
}

// ── legal_entity_ownership (V125) — a JV entity's cap table ────────────────
// Fetched independently of the parent entity's own payload/query key (not
// denormalized onto LegalEntity), same "own hooks, own key" shape as
// useBookEodStatus — this is a Tab-only sub-resource, edited separately.

function ownershipKey(jvEntityId: number | undefined | null) {
  return ['legal-entity-ownership', jvEntityId] as const;
}

export function useOwnershipForEntity(jvEntityId: number | null) {
  return useQuery({
    queryKey: ownershipKey(jvEntityId),
    queryFn: () => legalEntityApi.listOwnership(jvEntityId as number),
    enabled: jvEntityId !== null,
  });
}

export function useAddOwnership(jvEntityId: number | null) {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: LegalEntityOwnershipInput) => legalEntityApi.addOwnership(jvEntityId as number, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownershipKey(jvEntityId) });
      message.success('Ownership added.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Add ownership failed.');
    },
  });
}

export function useRemoveOwnership(jvEntityId: number | null) {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (ownershipId: number) => legalEntityApi.removeOwnership(jvEntityId as number, ownershipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ownershipKey(jvEntityId) });
      message.success('Ownership removed.');
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Remove ownership failed.');
    },
  });
}
