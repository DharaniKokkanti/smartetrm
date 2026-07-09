// V78: storage_facility.facility_type is now a numeric FK id
// (storage_facility_type parent table) — resolve a label via
// useCustomConfigOptions('STORAGE_FACILITY_TYPE'). Note the DB column is
// `facility_type`; this frontend field has always been named `storageType`.
export type StorageType = number;

export const STORAGE_STATUS_CODES = ['OPERATIONAL', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'] as const;
export type StorageStatusCode = (typeof STORAGE_STATUS_CODES)[number];

export interface StorageFacility {
  storageId: number;
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
  injectionRate: number | null;
  withdrawalRate: number | null;
  statusCode: StorageStatusCode;
  isActive: boolean;
  createdAt: string;
}

export type StorageFacilityInput = Omit<StorageFacility, 'storageId' | 'createdAt'>;
