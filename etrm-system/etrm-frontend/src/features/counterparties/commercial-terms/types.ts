import type { CommodityTypeTrade } from '@features/trade/types';

export interface CpCommercialTerms {
  cpTermsId: number;
  /** V128 — optimistic-locking token. Must be echoed back unchanged on
   *  update — see @components/smart/optimisticLock. */
  rowVersion: number;
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
