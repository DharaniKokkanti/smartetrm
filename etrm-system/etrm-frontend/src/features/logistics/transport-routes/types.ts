import type { CommodityType } from '@features/organization/desks/types';

export interface TransportRoute {
  routeId: number;
  motTypeId: number;
  motTypeName: string | null;
  routeCode: string;
  routeName: string;
  originLocationId: number;
  originLocationName: string | null;
  destLocationId: number;
  destLocationName: string | null;
  /** CSV of location_ids for optional intermediate stops */
  viaLocationIds: string | null;
  distanceKm: number | null;
  transitDaysMin: number | null;
  transitDaysMax: number | null;
  /** NULL = all commodities */
  commodityType: CommodityType | null;
  maxVesselSize: string | null;
  seasonalRestriction: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type TransportRouteInput = Omit<TransportRoute, 'routeId' | 'motTypeName' | 'originLocationName' | 'destLocationName' | 'createdAt'>;
