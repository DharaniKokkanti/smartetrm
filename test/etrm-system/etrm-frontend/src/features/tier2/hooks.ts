import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { referenceDataApi } from './api';
import type { ReferenceDataRow } from '@models/referenceData';
import type { ProblemDetail } from '@services/api';

export function useRegisteredTables() {
  return useQuery({
    queryKey: ['reference-data', 'registry'],
    queryFn: referenceDataApi.listTables,
  });
}

export function useTableMetadata(tableName: string | null) {
  return useQuery({
    queryKey: ['reference-data', tableName, 'metadata'],
    queryFn: () => referenceDataApi.getMetadata(tableName!),
    enabled: tableName !== null,
    // Metadata is schema-derived, not data — it changes only when the DB
    // schema changes, so it can sit far longer than the default staleTime.
    staleTime: 10 * 60_000,
  });
}

export function useTableRows(tableName: string | null) {
  return useQuery({
    queryKey: ['reference-data', tableName, 'rows'],
    queryFn: () => referenceDataApi.listRows(tableName!),
    enabled: tableName !== null,
  });
}

export function useSaveRow(tableName: string) {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, row }: { id: number | null; row: ReferenceDataRow }) =>
      id === null
        ? referenceDataApi.createRow(tableName, row)
        : referenceDataApi.updateRow(tableName, id, row),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-data', tableName, 'rows'] });
      message.success('Saved.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Save failed.'),
  });
}

export function useDeleteRow(tableName: string) {
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => referenceDataApi.deleteRow(tableName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reference-data', tableName, 'rows'] });
      message.success('Deleted.');
    },
    onError: (err: ProblemDetail) => message.error(err.detail ?? err.title ?? 'Delete failed.'),
  });
}
