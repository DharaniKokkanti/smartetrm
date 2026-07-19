import type { CommodityType } from '@features/reference/commodity-types/types';

export const LOCATION_TYPE_CODES = ['PORT', 'PIPELINE_HUB', 'GAS_HUB', 'GRID_NODE', 'POWER_PLANT', 'WAREHOUSE', 'EXCHANGE', 'REFINERY', 'LNG_TERMINAL', 'STORAGE_TANK', 'CUSTOMS_POINT'] as const;
export type LocationTypeCode = (typeof LOCATION_TYPE_CODES)[number];

export interface Location {
  locationId: number;
  /** V130 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  locationCode: string;
  locationName: string;
  locationTypeCode: LocationTypeCode;
  commodityType: CommodityType | null;
  countryId: number;
  portCode: string | null;
  unlocode: string | null;
  operator: string | null;
  capacity: number | null;
  capacityUomCode: string | null;
  latitude: number | null;
  longitude: number | null;
  // True when this location is a business office (not a delivery/operational point).
  officeLocInd: boolean;
  // True when this office also hosts a trading desk — subset of officeLocInd locations,
  // used to populate the desk-location picker (see useTradingDeskLocations()).
  tradingDeskInd: boolean;
  isActive: boolean;
  createdAt: string;
}

export type LocationInput = Omit<Location, 'locationId' | 'createdAt'>;
