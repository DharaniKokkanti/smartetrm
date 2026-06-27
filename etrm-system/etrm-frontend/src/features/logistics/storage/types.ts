export const STORAGE_TYPES = ['TANK_FARM', 'FLOATING_STORAGE', 'WAREHOUSE', 'SALT_CAVERN', 'GAS_STORAGE', 'PIPELINE_LINEFILL', 'LNG_TANK', 'SILO'] as const;
export type StorageType = (typeof STORAGE_TYPES)[number];

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
