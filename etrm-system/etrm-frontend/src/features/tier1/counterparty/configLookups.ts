import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import type { ReferenceDataRow } from '@models/referenceData';

export interface ConfigOption {
  label: string;
  value: string;
}

const GROUP_TO_TABLE: Record<string, string> = {
  COUNTERPARTY_TYPE: 'counterparty_type',
  KYC_STATUS:        'kyc_status',
  CONTACT_ROLE:      'contact_role',
  ADDRESS_TYPE:      'address_type',
  BANK_ACCOUNT_TYPE: 'bank_account_type',
};

async function fetchConfigOptions(group: string): Promise<ConfigOption[]> {
  const table = GROUP_TO_TABLE[group.toUpperCase()];
  if (!table) return [];
  const { data } = await apiClient.get<ReferenceDataRow[]>(`/reference-data/${table}`);
  return (data ?? [])
    .filter((row) => row.isActive !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((row) => ({
      label: String(row.typeName ?? row.typeCode ?? ''),
      value: String(row.typeCode ?? ''),
    }));
}

export function useCustomConfigOptions(group: string) {
  return useQuery({
    queryKey: ['lookup', GROUP_TO_TABLE[group.toUpperCase()] ?? group],
    queryFn: () => fetchConfigOptions(group),
    staleTime: 5 * 60_000,
  });
}
