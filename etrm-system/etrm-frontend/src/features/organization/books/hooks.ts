import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { booksApi } from './api';
import type { BookInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['books'] as const;

export function useBooks() {
  return useQuery({ queryKey: KEY, queryFn: booksApi.list });
}

export function useSaveBook() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: BookInput }) =>
      id === null ? booksApi.create(input) : booksApi.update(id, input),
    onSuccess: (d) => { qc.invalidateQueries({ queryKey: KEY }); message.success(`Book "${d.bookCode}" saved.`); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateBook() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: booksApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Book deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}

export function useArchiveBook() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) => booksApi.archive(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Book archived.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Archive failed.'),
  });
}

export function useMoveBook() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: { legalEntityId: number; parentBookId: number | null } }) =>
      booksApi.move(id, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Book moved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Move failed.'),
  });
}

export function useAddBookTrader() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ bookId, traderId, role }: { bookId: number; traderId: number; role: string }) =>
      booksApi.addTrader(bookId, { traderId, role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Trader added.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Add trader failed.'),
  });
}

export function useRemoveBookTrader() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ bookId, traderId }: { bookId: number; traderId: number }) =>
      booksApi.removeTrader(bookId, traderId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Trader removed.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Remove trader failed.'),
  });
}

export function useBookClassificationDimensions() {
  return useQuery({ queryKey: ['book-classification-dimensions'], queryFn: booksApi.listClassificationDimensions });
}

export function useAddBookClassification() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ bookId, dimensionCode, valueCode, valueLabel }:
      { bookId: number; dimensionCode: string; valueCode: string; valueLabel?: string | null }) =>
      booksApi.addClassification(bookId, { dimensionCode, valueCode, valueLabel }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Classification added.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Add classification failed.'),
  });
}

export function useRemoveBookClassification() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ bookId, bookClassificationId }: { bookId: number; bookClassificationId: number }) =>
      booksApi.removeClassification(bookId, bookClassificationId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Classification removed.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Remove classification failed.'),
  });
}

export function useBookEodStatus(bookId: number | undefined) {
  return useQuery({
    queryKey: ['book-eod-status', bookId],
    queryFn: () => booksApi.listEodStatus(bookId as number),
    enabled: bookId != null,
  });
}

/** V122's recursive CTE (`GET /books/{id}/descendants`) — every book, of any level, nested anywhere under `bookId`. Used to roll up positions/P&L for a selected container (DESK/STRATEGY/etc.) from its leaf Trading Book descendants, however many levels deep the admin-defined hierarchy happens to be. */
export function useBookDescendants(bookId: number | undefined, enabled = true) {
  return useQuery({
    queryKey: ['book-descendants', bookId],
    queryFn: () => booksApi.descendants(bookId as number),
    enabled: bookId != null && enabled,
  });
}

export function useLockBookEodStatus() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ bookId, businessDate }: { bookId: number; businessDate: string }) =>
      booksApi.lockEodStatus(bookId, businessDate),
    onSuccess: (_, { bookId }) => { qc.invalidateQueries({ queryKey: ['book-eod-status', bookId] }); message.success('Book locked for the day.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Lock failed.'),
  });
}

export function useReopenBookEodStatus() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ bookId, businessDate, reason }: { bookId: number; businessDate: string; reason: string }) =>
      booksApi.reopenEodStatus(bookId, businessDate, reason),
    onSuccess: (_, { bookId }) => { qc.invalidateQueries({ queryKey: ['book-eod-status', bookId] }); message.success('Book reopened.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Reopen failed.'),
  });
}
