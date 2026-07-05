import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import {
  counterpartyApi,
  addressApi,
  contactApi,
  fetchCounterpartyChildren,
  saveAddressAssignment,
  saveContactAssignment,
  saveTaxRegistrationAssignment,
} from './api';
import type { CounterpartyDraft } from './types';
import type { ProblemDetail } from '@services/api';

const LIST_KEY = ['counterparties'] as const;
const childrenKey = (id: number) => ['counterparties', id, 'children'] as const;

export function useCounterparties() {
  return useQuery({ queryKey: LIST_KEY, queryFn: counterpartyApi.list });
}

export function useCounterparty(id: number | null) {
  return useQuery({
    queryKey: ['counterparties', id],
    queryFn: () => counterpartyApi.get(id!),
    enabled: id !== null,
  });
}

export function useCounterpartyChildren(id: number | null) {
  return useQuery({
    queryKey: id !== null ? childrenKey(id) : ['counterparties', 'children', 'none'],
    queryFn: () => fetchCounterpartyChildren(id!),
    enabled: id !== null,
  });
}

export function useDeactivateCounterparty() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => counterpartyApi.deactivate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      message.success('Counterparty deactivated.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Deactivate failed.'),
  });
}

// ── Address / contact pool queries ────────────────────────────────────────────

export function useAddressPool() {
  return useQuery({ queryKey: ['address-pool'], queryFn: addressApi.pool, staleTime: 60_000 });
}

export function useContactPool() {
  return useQuery({ queryKey: ['contact-pool'], queryFn: contactApi.pool, staleTime: 60_000 });
}

// ── Save full counterparty draft ──────────────────────────────────────────────

export function useSaveCounterpartyDraft() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();

  return useMutation({
    mutationFn: async ({ id, draft }: { id: number | null; draft: CounterpartyDraft }) => {
      const parent =
        id === null
          ? await counterpartyApi.create(draft.core)
          : await counterpartyApi.update(id, draft.core);
      const cpId = parent.counterpartyId;

      const errors: string[] = [];

      for (const assignment of draft.addresses) {
        try {
          await saveAddressAssignment({
            ...assignment,
            entityType: 'COUNTERPARTY',
            entityId: cpId,
          });
        } catch {
          errors.push(`Address "${assignment.address.addressLine1}" failed to save.`);
        }
      }

      for (const assignment of draft.contacts) {
        try {
          await saveContactAssignment({
            ...assignment,
            entityType: 'COUNTERPARTY',
            entityId: cpId,
          });
        } catch {
          errors.push(`Contact "${assignment.contact.firstName} ${assignment.contact.lastName}" failed to save.`);
        }
      }

      for (const account of draft.bankAccounts) {
        const { _localId: _l, bankAccountId, ...rest } = account;
        const payload = { ...rest, entityType: 'COUNTERPARTY' as const, entityId: cpId };
        try {
          if (bankAccountId === null) await counterpartyApi.bankAccounts.create(cpId, payload);
          else await counterpartyApi.bankAccounts.update(cpId, bankAccountId, payload);
        } catch {
          errors.push(`Bank account "${account.accountName}" failed to save.`);
        }
      }

      for (const reg of draft.taxRegistrations) {
        try {
          await saveTaxRegistrationAssignment({ ...reg, entityType: 'COUNTERPARTY', entityId: cpId });
        } catch {
          errors.push(`Tax registration "${reg.taxType} ${reg.taxId}" failed to save.`);
        }
      }

      return { parent, errors };
    },
    onSuccess: ({ parent, errors }) => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: childrenKey(parent.counterpartyId) });
      queryClient.invalidateQueries({ queryKey: ['address-pool'] });
      queryClient.invalidateQueries({ queryKey: ['contact-pool'] });
      if (errors.length === 0) {
        message.success(`Counterparty "${parent.cpCode}" saved.`);
      } else {
        message.warning(
          `Counterparty saved, but ${errors.length} record(s) failed: ${errors.join(' ')}`,
        );
      }
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Save failed.');
    },
  });
}
