import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import {
  counterpartyApi,
  addressApi,
  contactApi,
  fetchCounterpartyChildren,
  fetchAllContactAssignments,
  fetchAllTaxRegistrations,
  fetchAllLicenseRegistrations,
  saveAddressAssignment,
  saveContactAssignment,
  saveTaxRegistrationAssignment,
  saveLicenseRegistrationAssignment,
  deactivateContactAssignment,
  deactivateTaxRegistrationAssignment,
  deactivateLicenseRegistrationAssignment,
  settlementInstructionApi,
} from './api';
import type { BankAccount, ContactAssignment, CounterpartyDraft, SettlementInstructionCreateInput, TaxRegistration, LicenseRegistration } from './types';
import type { ProblemDetail } from '@services/api';
import { isOptimisticLockConflict, showOptimisticLockConflict } from '@components/smart/optimisticLock';

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
  const { message, notification } = AntApp.useApp();

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
      if (isOptimisticLockConflict(err)) {
        showOptimisticLockConflict(notification);
      } else {
        message.error(err.detail ?? err.title ?? 'Save failed.');
      }
    },
  });
}

// ── Cross-entity directory queries/mutations ──────────────────────────────────
// Unscoped — every record across every counterparty/legal entity — used by
// the standalone directory pages (Contacts, Tax Registrations, Bank
// Accounts), as opposed to the entity-scoped Sections embedded in the
// Counterparty/Legal Entity forms above.

const ALL_CONTACTS_KEY = ['entity-contacts', 'all'] as const;
const ALL_TAX_REGISTRATIONS_KEY = ['entity-tax-registrations', 'all'] as const;
const ALL_LICENSE_REGISTRATIONS_KEY = ['entity-license-registrations', 'all'] as const;
const ALL_BANK_ACCOUNTS_KEY = ['bank-accounts', 'all'] as const;

export function useAllContactAssignments() {
  return useQuery({ queryKey: ALL_CONTACTS_KEY, queryFn: fetchAllContactAssignments });
}

export function useSaveContactAssignment() {
  const queryClient = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: (assignment: ContactAssignment) => saveContactAssignment(assignment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_CONTACTS_KEY });
      queryClient.invalidateQueries({ queryKey: ['contact-pool'] });
      message.success('Contact saved.');
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

export function useDeactivateContactAssignment() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (entityContactId: number) => deactivateContactAssignment(entityContactId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_CONTACTS_KEY });
      message.success('Contact removed.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Remove failed.'),
  });
}

export function useAllTaxRegistrations() {
  return useQuery({ queryKey: ALL_TAX_REGISTRATIONS_KEY, queryFn: fetchAllTaxRegistrations });
}

export function useSaveTaxRegistration() {
  const queryClient = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: (reg: TaxRegistration) => saveTaxRegistrationAssignment(reg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_TAX_REGISTRATIONS_KEY });
      message.success('Tax registration saved.');
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

export function useDeactivateTaxRegistration() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (taxRegId: number) => deactivateTaxRegistrationAssignment(taxRegId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_TAX_REGISTRATIONS_KEY });
      message.success('Tax registration removed.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Remove failed.'),
  });
}

export function useAllLicenseRegistrations() {
  return useQuery({ queryKey: ALL_LICENSE_REGISTRATIONS_KEY, queryFn: fetchAllLicenseRegistrations });
}

export function useSaveLicenseRegistration() {
  const queryClient = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: (reg: LicenseRegistration) => saveLicenseRegistrationAssignment(reg),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_LICENSE_REGISTRATIONS_KEY });
      message.success('License registration saved.');
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

export function useDeactivateLicenseRegistration() {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (licenseRegId: number) => deactivateLicenseRegistrationAssignment(licenseRegId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_LICENSE_REGISTRATIONS_KEY });
      message.success('License registration removed.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Remove failed.'),
  });
}

export function useAllBankAccounts() {
  return useQuery({ queryKey: ALL_BANK_ACCOUNTS_KEY, queryFn: counterpartyApi.bankAccounts.listAll });
}

export function useSaveBankAccount() {
  const queryClient = useQueryClient();
  const { message, notification } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ entityId, account }: { entityId: number; account: BankAccount }) => {
      const { _localId: _l, bankAccountId, ...rest } = account;
      return bankAccountId === null
        ? counterpartyApi.bankAccounts.create(entityId, rest)
        : counterpartyApi.bankAccounts.update(entityId, bankAccountId, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALL_BANK_ACCOUNTS_KEY });
      message.success('Bank account saved.');
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

// ── Settlement instructions (dbo.settlement_instruction, V159) ────────────────

const ssiKey = (cpId: number) => ['counterparties', cpId, 'settlement-instructions'] as const;

export function useSettlementInstructions(cpId: number | null) {
  return useQuery({
    queryKey: cpId !== null ? ssiKey(cpId) : ['settlement-instructions', 'none'],
    queryFn: () => settlementInstructionApi.listForCounterparty(cpId!),
    enabled: cpId !== null,
  });
}

export function useCreateSettlementInstruction(cpId: number | null) {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (input: SettlementInstructionCreateInput) => settlementInstructionApi.create(cpId!, input),
    onSuccess: () => {
      if (cpId !== null) queryClient.invalidateQueries({ queryKey: ssiKey(cpId) });
      message.success('Settlement instruction created — pending verification by a second user before it becomes active.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Create failed.'),
  });
}

export function useVerifySettlementInstruction(cpId: number | null) {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, verificationMethod }: { id: number; verificationMethod: string }) =>
      settlementInstructionApi.verify(id, verificationMethod),
    onSuccess: () => {
      if (cpId !== null) queryClient.invalidateQueries({ queryKey: ssiKey(cpId) });
      message.success('Settlement instruction verified and now active.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Verify failed.'),
  });
}

export function useRejectSettlementInstruction(cpId: number | null) {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, notes }: { id: number; notes?: string }) => settlementInstructionApi.reject(id, notes),
    onSuccess: () => {
      if (cpId !== null) queryClient.invalidateQueries({ queryKey: ssiKey(cpId) });
      message.success('Settlement instruction rejected.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Reject failed.'),
  });
}
