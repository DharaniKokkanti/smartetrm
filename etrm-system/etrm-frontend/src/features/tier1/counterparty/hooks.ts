import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { counterpartyApi, fetchCounterpartyChildren } from './api';
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

/**
 * Orchestrates the full "associated data added immediately" save: the
 * parent record is created/updated first (so it has a real id), then every
 * staged or edited child record is flushed against that id — new children
 * (no server id yet) POST, existing children PUT. This is what lets the
 * form feel like "one save" to the user while still respecting the nested
 * REST contract (POST/PUT /counterparties/{id}/contacts etc.) underneath.
 */
export function useSaveCounterpartyDraft() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();

  return useMutation({
    mutationFn: async ({ id, draft }: { id: number | null; draft: CounterpartyDraft }) => {
      const parent =
        id === null ? await counterpartyApi.create(draft.core) : await counterpartyApi.update(id, draft.core);
      const cpId = parent.counterpartyId;

      const errors: string[] = [];

      for (const contact of draft.contacts) {
        const { _localId: _l, contactId, ...rest } = contact;
        const payload = { ...rest, entityType: 'COUNTERPARTY' as const, entityId: cpId };
        try {
          if (contactId === null) await counterpartyApi.contacts.create(cpId, payload);
          else await counterpartyApi.contacts.update(cpId, contactId, payload);
        } catch {
          errors.push(`Contact "${contact.firstName} ${contact.lastName}" failed to save.`);
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

      for (const address of draft.addresses) {
        const { _localId: _l, addressId, ...rest } = address;
        const payload = { ...rest, entityType: 'COUNTERPARTY' as const, entityId: cpId };
        try {
          if (addressId === null) await counterpartyApi.addresses.create(cpId, payload);
          else await counterpartyApi.addresses.update(cpId, addressId, payload);
        } catch {
          errors.push(`Address "${address.addressLine1}" failed to save.`);
        }
      }

      return { parent, errors };
    },
    onSuccess: ({ parent, errors }) => {
      queryClient.invalidateQueries({ queryKey: LIST_KEY });
      queryClient.invalidateQueries({ queryKey: childrenKey(parent.counterpartyId) });
      if (errors.length === 0) {
        message.success(`Counterparty "${parent.cpCode}" saved.`);
      } else {
        message.warning(
          `Counterparty saved, but ${errors.length} associated record(s) failed: ${errors.join(' ')}`,
        );
      }
    },
    onError: (err: ProblemDetail) => {
      message.error(err.detail ?? err.title ?? 'Save failed.');
    },
  });
}
