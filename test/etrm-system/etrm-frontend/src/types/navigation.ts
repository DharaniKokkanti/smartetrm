/** A single navigable item in the sidebar — either a Tier 1 entity screen
 *  or (later) a Tier 2 reference-data table, both resolve to this shape. */
export interface NavItem {
  key: string;
  label: string;
  path: string;
  moduleGroup: string;
}

/** Mirrors master_data_table_registry — populated for real once the Tier 2
 *  API exists; placeholder shape lives here now so Tier 1 code and the
 *  future Tier 2 code agree on the contract from day one. */
export interface MasterDataTableRegistryEntry {
  registryId: number;
  tableName: string;
  displayName: string;
  moduleGroup: string;
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowExcelUpload: boolean;
  isEnabled: boolean;
  displayOrder: number;
}
