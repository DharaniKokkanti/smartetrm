export const RAILCAR_TYPES = ['TANK_CAR', 'HOPPER_CAR', 'COVERED_HOPPER', 'FLATCAR', 'BOXCAR', 'OTHER'] as const;
export type RailcarType = (typeof RAILCAR_TYPES)[number];

export interface Railcar {
  railcarId: number;
  carNumber: string;
  carType: RailcarType;
  operatorId: number;
  operatorName: string;
  capacityLitres: number | null;
  capacityMt: number | null;
  dotClass: string | null;
  aarClass: string | null;
  buildYear: number | null;
  grossRailLoadLbs: number | null;
  lastTestDate: string | null;
  nextTestDate: string | null;
  certExpiry: string | null;
  homeRailroad: string | null;
  countryCode: string;
  countryName: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type RailcarInput = Omit<Railcar, 'railcarId' | 'operatorName' | 'countryName' | 'createdAt'>;

// ─── Approved products (dbo.mot_asset_product_approval, asset_type='RAILCAR') ─
export const ASSET_APPROVAL_STATUSES = ['APPROVED', 'CONDITIONAL', 'SUSPENDED', 'REJECTED'] as const;
export type AssetApprovalStatus = (typeof ASSET_APPROVAL_STATUSES)[number];

export interface RailcarProductApproval {
  assetApprovalId: number;
  assetType: 'RAILCAR';
  assetId: number;
  productId: number;
  productName: string;
  maxQuantity: number | null;
  quantityUomId: number | null;
  quantityUomCode: string | null;
  approvalStatus: AssetApprovalStatus;
  conditions: string | null;
  regulatoryRef: string | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  approvedBy: string | null;
  notes: string | null;
}

export type RailcarProductApprovalInput = Omit<RailcarProductApproval, 'assetApprovalId' | 'assetType' | 'productName' | 'quantityUomCode'>;
