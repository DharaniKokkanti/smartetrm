import type { CommodityType } from '@features/organization/desks/types';

export const LOCATION_TYPE_CODES = ['PORT', 'PIPELINE_HUB', 'GAS_HUB', 'GRID_NODE', 'POWER_PLANT', 'WAREHOUSE', 'EXCHANGE', 'REFINERY', 'LNG_TERMINAL', 'STORAGE_TANK', 'CUSTOMS_POINT'] as const;
export type LocationTypeCode = (typeof LOCATION_TYPE_CODES)[number];

export interface Location {
  locationId: number;
  locationCode: string;
  locationName: string;
  locationTypeCode: LocationTypeCode;
  commodityType: CommodityType | null;
  countryCode: string;
  portCode: string | null;
  unlocode: string | null;
  operator: string | null;
  capacity: number | null;
  capacityUomCode: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
}

export type LocationInput = Omit<Location, 'locationId' | 'createdAt'>;
