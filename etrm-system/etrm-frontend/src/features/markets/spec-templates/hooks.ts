import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { specTemplatesApi } from './api';
import type { ProductSpecTemplateInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['spec-templates'] as const;

export function useSpecTemplates() {
  return useQuery({ queryKey: KEY, queryFn: specTemplatesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveSpecTemplate() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: ProductSpecTemplateInput }) =>
      id === null ? specTemplatesApi.create(input) : specTemplatesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Spec template saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
