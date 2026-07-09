/** Mirrors master_data_table_registry — the control table that drives the
 *  generic Tier 2 screen. One row per exposed reference table; adding a new
 *  table to the screen is a data change here, not a code change. */
export interface RegistryEntry {
  registryId: number;
  tableName: string;
  displayName: string;
  moduleGroup: string;
  /** Second-level grouping within moduleGroup, shown as a collapsible header in the sidebar */
  subGroup?: string;
  /** Short paragraph shown in the description panel above the table */
  description?: string;
  allowCreate: boolean;
  allowEdit: boolean;
  allowDelete: boolean;
  allowExcelUpload: boolean;
  isEnabled: boolean;
  displayOrder: number;
}

export type ColumnDataKind = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'foreign_key';

/** One column's shape, derived server-side from INFORMATION_SCHEMA +
 *  sys.check_constraints + sys.foreign_keys (see the Spring Boot
 *  MetadataService) — never hand-maintained per table. */
export interface ColumnMetadata {
  name: string;
  label: string;
  kind: ColumnDataKind;
  isPrimaryKey: boolean;
  nullable: boolean;
  maxLength: number | null;
  /** Populated when kind === 'enum' — the literal values from the table's
   *  CHECK constraint. */
  enumValues: string[] | null;
  /** Populated when kind === 'foreign_key' — which reference table this
   *  column points to, so the form can render a searchable lookup instead
   *  of a raw integer input. */
  foreignKeyTable: string | null;
  /** Populated when foreignKeyTable === 'lookup_value' — scopes the option
   *  list to one lookup_value.category, since that table holds every small
   *  picklist in the schema in one shared row set (e.g. 'operator_type').
   *  Not needed for any other foreign_key target, which each have their own
   *  dedicated table. */
  foreignKeyCategory: string | null;
  /** Populated when kind === 'number' — derived from the real SQL type
   *  (INT/BIGINT/SMALLINT/TINYINT -> 'integer'; DECIMAL/NUMERIC/FLOAT/REAL/
   *  MONEY -> 'decimal'). Drives whether the input accepts a decimal point
   *  at all — a count/id/day column shouldn't silently take "3.5". */
  numericSubKind: 'integer' | 'decimal' | null;
}

export interface TableMetadata {
  tableName: string;
  displayName: string;
  primaryKeyColumn: string;
  isTemporal: boolean;
  columns: ColumnMetadata[];
}

/** A reference-data row is structurally unknown ahead of time — it's
 *  whatever columns that table's metadata says it has. */
export type ReferenceDataRow = Record<string, string | number | boolean | null> & {
  [key: string]: string | number | boolean | null;
};
