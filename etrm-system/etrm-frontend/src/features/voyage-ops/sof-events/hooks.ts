import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import { sofEventsApi } from './api';
import type { VoyageSofEventInput } from './types';
import type { ProblemDetail } from '@services/api';

const KEY = ['sof-events'] as const;

export function useSofEvents(voyageId: number | undefined) {
  return useQuery({ queryKey: [...KEY, voyageId], queryFn: () => sofEventsApi.list(voyageId), enabled: voyageId !== undefined });
}

export function useSaveSofEvent() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: ({ id, input }: { id: number | null; input: VoyageSofEventInput }) =>
      id === null ? sofEventsApi.create(input) : sofEventsApi.update(id, input),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); message.success('SOF event saved.'); },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Save failed.'),
  });
}
