import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { portActivityTemplateStepsApi } from './api';
import type { PortActivityTemplateStepInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['port-activity-template-steps'] as const;

export function usePortActivityTemplateSteps(templateId: number | undefined) {
  return useQuery({
    queryKey: [...KEY, templateId],
    queryFn: () => portActivityTemplateStepsApi.list(templateId),
    enabled: templateId !== undefined,
  });
}

export function useSavePortActivityTemplateStep() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: PortActivityTemplateStepInput }) =>
      id === null ? portActivityTemplateStepsApi.create(input) : portActivityTemplateStepsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Step saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}

export function useDeletePortActivityTemplateStep() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (id: number) => portActivityTemplateStepsApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('Step removed.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Remove failed.'),
  });
}
