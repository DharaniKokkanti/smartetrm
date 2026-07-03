export const BOLMO_STATUSES = ['PENDING', 'AGREED', 'COMPLETED', 'DISPUTED', 'CANCELLED'] as const;
export type BolmoStatus = (typeof BOLMO_STATUSES)[number];

export const BOLMO_DIRECTIONS = ['BUY', 'SELL'] as const;
export type BolmoDirection = (typeof BOLMO_DIRECTIONS)[number];

export interface BolmoLeg {
  legId: number;
  bolmoId: number;
  orderId: number | null;
  orderReference: string | null;
  direction: BolmoDirection;
  quantity: number;
  uomCode: string;
  price: number | null;
  notes: string | null;
  createdAt: string;
}

export type BolmoLegInput = Omit<BolmoLeg, 'legId' | 'orderReference' | 'createdAt'>;

export interface BolmoAgreement {
  bolmoId: number;
  bolmoReference: string;       // auto: BKO-2026-00001
  counterpartyId: number;
  counterpartyName: string;
  legalEntityId: number;
  legalEntityName: string;
  agreementDate: string;
  settlementDate: string | null;
  commodityType: string;
  deliveryLocationCode: string | null;
  deliveryPeriodCode: string | null;
  netQuantity: number;
  uomCode: string;
  nettingPrice: number | null;  // agreed cash settlement price
  currencyCode: string;
  status: BolmoStatus;
  notes: string | null;
  legs: BolmoLeg[];
  legCount: number;             // computed
  createdAt: string;
  updatedAt: string;
}

export type BolmoAgreementInput = Omit<
  BolmoAgreement,
  'bolmoId' | 'bolmoReference' | 'counterpartyName' | 'legalEntityName' | 'legs' | 'legCount' | 'createdAt' | 'updatedAt'
>;
