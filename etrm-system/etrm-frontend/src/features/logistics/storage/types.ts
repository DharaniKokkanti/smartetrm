// V78: storage_facility.facility_type is now a numeric FK id
// (storage_facility_type parent table) — resolve a label via
// useCustomConfigOptions('STORAGE_FACILITY_TYPE'). Note the DB column is
// `facility_type`; this frontend field has always been named `storageType`.
export type StorageType = number;

export const STORAGE_STATUS_CODES = ['OPERATIONAL', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'] as const;
export type StorageStatusCode = (typeof STORAGE_STATUS_CODES)[number];

export interface StorageFacility {
  storageId: number;
  /** V130 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  storageCode: string;
  storageName: string;
  storageType: StorageType;
  locationId: number | null;
  locationCode: string | null;
  commodityType: string | null;
  capacity: number;
  capacityUomCode: string;
  operatorName: string;
  countryCode: string;
  regulatoryRef: string | null;
  /** V161 — max commodity injection per day; gas storage's primary use case, backed by max_injection_rate_per_day. */
  injectionRate: number | null;
  /** V161 — max commodity withdrawal per day; backed by max_withdrawal_rate_per_day. */
  withdrawalRate: number | null;
  /** V161 — usable/withdrawable gas volume, gas storage facilities only. */
  workingGasCapacity: number | null;
  /** V161 — permanent base gas required to maintain reservoir pressure, gas storage facilities only. */
  cushionGasVolume: number | null;
  /** V161 — shared UOM for workingGasCapacity/cushionGasVolume/injectionRate/withdrawalRate (e.g. MMBtu, MCF). */
  gasVolumeUomCode: string | null;
  statusCode: StorageStatusCode;
  isActive: boolean;
  createdAt: string;
}

export type StorageFacilityInput = Omit<StorageFacility, 'storageId' | 'createdAt'>;
