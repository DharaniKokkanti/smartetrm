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
    mutationFn: ({ id, body }: { id: number; body: { legalEntityId: number; deskId: number | null; parentBookId: number | null } }) =>
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
