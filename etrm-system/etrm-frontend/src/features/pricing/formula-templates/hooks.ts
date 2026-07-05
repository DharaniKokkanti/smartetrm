import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { formulaTemplatesApi } from './api';
import type { FormulaTemplateInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['formula-templates'] as const;

export function useFormulaTemplates() {
  return useQuery({ queryKey: KEY, queryFn: formulaTemplatesApi.list, staleTime: 5 * 60 * 1000 });
}

export function useSaveFormulaTemplate() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: FormulaTemplateInput }) =>
      id === null ? formulaTemplatesApi.create(input) : formulaTemplatesApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Formula template saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeactivateFormulaTemplate() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: formulaTemplatesApi.deactivate,
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Formula template deactivated.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Deactivate failed.'),
  });
}
