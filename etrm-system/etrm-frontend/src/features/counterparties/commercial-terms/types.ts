import type { CommodityTypeTrade } from '@features/trade/types';

export interface CpCommercialTerms {
  cpTermsId: number;
  counterpartyId: number;
  counterpartyName: string;
  legalEntityId: number;
  legalEntityName: string;
  paymentTermId: number;
  paymentTermName: string;
  creditTermId: number;
  creditTermName: string;
  defaultCurrencyId: number | null;
  defaultIncotermId: number | null;
  commodityType: CommodityTypeTrade | null;
  effectiveDate: string;
  expiryDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CpCommercialTermsInput = Omit<
  CpCommercialTerms,
  'cpTermsId' | 'counterpartyName' | 'legalEntityName' | 'paymentTermName' | 'creditTermName' | 'createdAt' | 'updatedAt'
>;
