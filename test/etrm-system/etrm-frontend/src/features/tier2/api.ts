import { apiClient } from '@services/api';
import type { RegistryEntry, TableMetadata, ReferenceDataRow } from '@models/referenceData';

const BASE = '/reference-data';

export const referenceDataApi = {
  /** Drives the Tier 2 sidebar — every registered table, grouped by module. */
  listTables: async (): Promise<RegistryEntry[]> => {
    const { data } = await apiClient.get<RegistryEntry[]>(BASE);
    return data;
  },

  getMetadata: async (tableName: string): Promise<TableMetadata> => {
    const { data } = await apiClient.get<TableMetadata>(`${BASE}/${tableName}/metadata`);
    return data;
  },

  listRows: async (tableName: string): Promise<ReferenceDataRow[]> => {
    const { data } = await apiClient.get<ReferenceDataRow[]>(`${BASE}/${tableName}`);
    return data;
  },

  createRow: async (tableName: string, row: ReferenceDataRow): Promise<ReferenceDataRow> => {
    const { data } = await apiClient.post<ReferenceDataRow>(`${BASE}/${tableName}`, row);
    return data;
  },

  updateRow: async (
    tableName: string,
    id: number,
    row: ReferenceDataRow,
  ): Promise<ReferenceDataRow> => {
    const { data } = await apiClient.put<ReferenceDataRow>(`${BASE}/${tableName}/${id}`, row);
    return data;
  },

  deleteRow: async (tableName: string, id: number): Promise<void> => {
    await apiClient.delete(`${BASE}/${tableName}/${id}`);
  },
};
