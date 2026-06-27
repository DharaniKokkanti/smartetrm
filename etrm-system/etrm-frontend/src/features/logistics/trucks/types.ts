export const VEHICLE_TYPES = ['ROAD_TANKER', 'DRY_BULK', 'FLATBED', 'REFRIGERATED', 'ISOTANK', 'CONTAINER'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];

export const VEHICLE_STATUS_CODES = ['ACTIVE', 'IN_SERVICE', 'MAINTENANCE', 'RETIRED'] as const;
export type VehicleStatusCode = (typeof VEHICLE_STATUS_CODES)[number];

export interface Truck {
  vehicleId: number;
  vehicleCode: string;
  vehicleName: string | null;
  vehicleType: VehicleType;
  licensePlate: string;
  operatorName: string;
  capacity: number;
  capacityUomCode: string;
  countryCode: string;
  gvwTonnes: number | null;
  licenseExpiryDate: string | null;
  inspectionExpiryDate: string | null;
  adrCertExpiry: string | null;
  commodityType: string | null;
  statusCode: VehicleStatusCode;
  isActive: boolean;
  createdAt: string;
}

export type TruckInput = Omit<Truck, 'vehicleId' | 'createdAt'>;
