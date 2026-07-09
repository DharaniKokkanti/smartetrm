import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import type { ReferenceDataRow } from '@models/referenceData';

export interface ConfigOption {
  label: string;
  value: number;
}

// V78 finished the backend cutover for all 13 of V17's parent lookup tables
// (12 pairs — book_type was done separately by V55) from CHECK+VARCHAR to a
// real FK id. Every group below is one of those tables — `/reference-data/
// {table}` already serves real rows with a numeric primary key (see
// PARENT_LOOKUP_TABLES in mocks/referenceData.ts); GROUP_TO_PK records which
// column on each row is that key, since ReferenceDataRow has no static shape.
const GROUP_TO_TABLE: Record<string, string> = {
  COUNTERPARTY_TYPE:     'counterparty_type',
  KYC_STATUS:            'kyc_status',
  CONTACT_ROLE:          'contact_role',
  ADDRESS_TYPE:          'address_type',
  BANK_ACCOUNT_TYPE:     'bank_account_type',
  PAYMENT_METHOD:        'payment_method',
  SETTLEMENT_TYPE:       'settlement_type',
  STORAGE_FACILITY_TYPE: 'storage_facility_type',
  NETTING_AGREEMENT_TYPE:'netting_agreement_type',
  TAX_TYPE:              'tax_type',
  LEGAL_ENTITY_TYPE:     'legal_entity_type',
  DEAL_TYPE:             'deal_type',
};

const GROUP_TO_PK: Record<string, string> = {
  COUNTERPARTY_TYPE:     'counterpartyTypeId',
  KYC_STATUS:            'kycStatusId',
  CONTACT_ROLE:          'contactRoleId',
  ADDRESS_TYPE:          'addressTypeId',
  BANK_ACCOUNT_TYPE:     'bankAccountTypeId',
  PAYMENT_METHOD:        'paymentMethodId',
  SETTLEMENT_TYPE:       'settlementTypeId',
  STORAGE_FACILITY_TYPE: 'storageFacilityTypeId',
  NETTING_AGREEMENT_TYPE:'nettingAgreementTypeId',
  TAX_TYPE:              'taxTypeId',
  LEGAL_ENTITY_TYPE:     'legalEntityTypeId',
  DEAL_TYPE:             'dealTypeId',
};

async function fetchConfigOptions(group: string): Promise<ConfigOption[]> {
  const key = group.toUpperCase();
  const table = GROUP_TO_TABLE[key];
  const pk = GROUP_TO_PK[key];
  if (!table || !pk) return [];
  const { data } = await apiClient.get<ReferenceDataRow[]>(`/reference-data/${table}`);
  return (data ?? [])
    .filter((row) => row.isActive !== false)
    .sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
    .map((row) => ({
      label: String(row.typeName ?? row.typeCode ?? ''),
      value: Number(row[pk]),
    }));
}

export function useCustomConfigOptions(group: string) {
  return useQuery({
    queryKey: ['lookup', GROUP_TO_TABLE[group.toUpperCase()] ?? group],
    queryFn: () => fetchConfigOptions(group),
    staleTime: 5 * 60_000,
  });
}
