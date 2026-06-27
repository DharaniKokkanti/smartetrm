import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import type { ReferenceDataRow } from '@models/referenceData';

export interface ConfigOption {
  label: string;
  value: string;
}

async function fetchConfigOptions(group: string): Promise<ConfigOption[]> {
  const { data } = await apiClient.get<ReferenceDataRow[]>('/reference-data/custom_config');
  return (data ?? [])
    .filter((row) => String(row.configGroup ?? '').toUpperCase() === group.toUpperCase())
    .filter((row) => row.isActive !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((row) => ({
      label: String(row.label ?? row.code ?? ''),
      value: String(row.code ?? ''),
    }));
}

export function useCustomConfigOptions(group: string) {
  return useQuery({
    queryKey: ['custom-config', group],
    queryFn: () => fetchConfigOptions(group),
    staleTime: 5 * 60_000,
  });
}
