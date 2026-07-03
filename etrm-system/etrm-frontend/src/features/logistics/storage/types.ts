export const STORAGE_TYPES = [
  'TANK_FARM',            // fixed or floating-roof above-ground tanks (crude, products)
  'FLOATING_STORAGE',     // vessel used as offshore storage (FSU)
  'WAREHOUSE',            // covered dry storage (metals, agri bagged goods)
  'SALT_CAVERN',          // underground salt cavern (crude, gas, LPG)
  'GAS_STORAGE',          // depleted reservoir or aquifer gas storage
  'PIPELINE_LINEFILL',    // product held in active pipeline as operational stock
  'LNG_TANK',             // cryogenic LNG storage tank at a terminal
  'SILO',                 // grain or dry-bulk silo
  'REFRIGERATED_STORAGE', // pressure/refrigerated storage (LPG, ammonia, ethylene)
  'CHEMICAL_TANK',        // chemical tank (petrochemicals, solvents, acids)
  'FSRU',                 // Floating Storage Regasification Unit
  'REFINERY',             // crude oil refinery with intermediate storage
  'VAULT',                // secure vault for metals (LME-approved, precious)
  'OTHER',                // facility type not covered by standard classifications
] as const;
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
