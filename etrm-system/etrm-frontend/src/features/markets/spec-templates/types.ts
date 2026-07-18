import type { CommodityType } from '@features/reference/commodity-types/types';

export const SPEC_TEMPLATE_COMMODITY_TYPES = ['OIL', 'GAS', 'POWER', 'LNG', 'AGRICULTURAL', 'METALS', 'FREIGHT', 'RINS', 'ENVIRONMENTAL', 'MULTI', 'OTHER'] as const;

export interface ProductSpecTemplate {
  templateId: number;
  productId: number;
  productCode: string | null;
  productName: string | null;
  templateCode: string;
  templateName: string;
  commodityType: CommodityType;
  isDefault: boolean;
  issuingBody: string | null;
  standardRef: string | null;
  version: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type ProductSpecTemplateInput = Omit<ProductSpecTemplate, 'templateId' | 'productCode' | 'productName' | 'createdAt'>;
