export interface VoyageCargoParcel {
  cargoParcelId: number;
  voyageId: number;
  productId: number | null;
  productName: string | null;
  commodityType: string | null;
  quantity: number;
  uomId: number;
  uomCode: string | null;
  loadTerminalLocationId: number | null;
  loadTerminalName: string | null;
  dischargeTerminalLocationId: number | null;
  dischargeTerminalName: string | null;
  tradeOrderId: number | null;
  tradeItemId: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type VoyageCargoParcelInput = Omit<
  VoyageCargoParcel,
  | 'cargoParcelId'
  | 'productName'
  | 'commodityType'
  | 'uomCode'
  | 'loadTerminalName'
  | 'dischargeTerminalName'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy'
>;
