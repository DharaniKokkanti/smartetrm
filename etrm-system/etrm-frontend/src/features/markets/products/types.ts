import type { CommodityType } from '@features/organization/desks/types';

export const SETTLEMENT_TYPES = ['PHYSICAL', 'FINANCIAL', 'OPTIONS', 'SWAP'] as const;
export type SettlementType = (typeof SETTLEMENT_TYPES)[number];

export interface Product {
  productId: number;
  productCode: string;
  productName: string;
  commodityId: number;
  commodityType: CommodityType;
  settlementType: SettlementType;
  defaultPricingTypeCode: string;
  defaultUomCode: string;
  lotSize: number | null;
  minQuantity: number | null;
  maxQuantity: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ProductInput = Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>;
