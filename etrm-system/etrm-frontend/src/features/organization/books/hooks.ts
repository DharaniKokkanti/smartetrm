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
