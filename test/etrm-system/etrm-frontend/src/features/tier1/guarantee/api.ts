import { apiClient } from '@services/api';
import type { ParentCompanyGuarantee, ParentCompanyGuaranteeInput } from './types';
import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';

const BASE = '/parent-company-guarantees';

export const guaranteeApi = {
  list: async (): Promise<ParentCompanyGuarantee[]> => {
    const { data } = await apiClient.get<ParentCompanyGuarantee[]>(BASE);
    return data;
  },
  /** Every PCG where the given entity appears in ANY role (guarantor,
   *  principal, or beneficiary) — used by the Counterparty/Legal Entity
   *  form's "Guarantees" tab. */
  listForEntity: async (
    entityType: PolymorphicEntityType,
    entityId: number,
  ): Promise<ParentCompanyGuarantee[]> => {
    const { data } = await apiClient.get<ParentCompanyGuarantee[]>(BASE, {
      params: { entityType, entityId },
    });
    return data;
  },
  create: async (input: ParentCompanyGuaranteeInput): Promise<ParentCompanyGuarantee> => {
    const { data } = await apiClient.post<ParentCompanyGuarantee>(BASE, input);
    return data;
  },
  update: async (id: number, input: ParentCompanyGuaranteeInput): Promise<ParentCompanyGuarantee> => {
    const { data } = await apiClient.put<ParentCompanyGuarantee>(`${BASE}/${id}`, input);
    return data;
  },
  deactivate: async (id: number): Promise<void> => {
    await apiClient.patch(`${BASE}/${id}/deactivate`);
  },
};
