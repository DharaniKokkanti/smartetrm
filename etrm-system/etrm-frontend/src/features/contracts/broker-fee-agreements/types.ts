export const FEE_TYPES = ['PER_LOT', 'PCT_NOTIONAL', 'FLAT_PER_TRADE', 'FLAT_MONTHLY'] as const;
export type FeeType = (typeof FEE_TYPES)[number];

export const PAY_PERIODS = ['PER_TRADE', 'MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'ANNUAL'] as const;
export type PayPeriod = (typeof PAY_PERIODS)[number];

export const BFA_COMMODITY_TYPES = ['OIL', 'GAS', 'POWER', 'LNG', 'METALS', 'AGRICULTURAL', 'FREIGHT'] as const;
export type BfaCommodityType = (typeof BFA_COMMODITY_TYPES)[number];

export const FEE_TYPE_META: Record<FeeType, { label: string; color: string; rateLabel: string; hint: string }> = {
  PER_LOT: {
    label: 'Per Lot',
    color: 'blue',
    rateLabel: 'Rate per Unit',
    hint: 'Fixed $ per unit of measure — e.g. $0.02/BBL, $0.01/MWH, $1.00/MT. Most common for physical OTC cargoes and bilateral swaps.',
  },
  PCT_NOTIONAL: {
    label: '% Notional',
    color: 'purple',
    rateLabel: 'Rate (decimal, e.g. 0.0004 = 0.04%)',
    hint: 'Percentage of trade notional value. Enter as decimal: 0.0004 = 0.04%. Common for financial/swap trades where lot size varies.',
  },
  FLAT_PER_TRADE: {
    label: 'Flat per Trade',
    color: 'orange',
    rateLabel: 'Flat Fee per Trade',
    hint: 'Fixed dollar amount charged per individual trade regardless of size. Common for freight voyages ($2,500/cargo) and bespoke structured deals.',
  },
  FLAT_MONTHLY: {
    label: 'Flat Monthly',
    color: 'gold',
    rateLabel: 'Monthly Retainer Amount',
    hint: 'Fixed monthly fee regardless of trading volume. Often used as a minimum guarantee or standing retainer alongside a per-lot rate.',
  },
};

export const PAY_PERIOD_LABELS: Record<PayPeriod, string> = {
  PER_TRADE:   'Per Trade',
  MONTHLY:     'Monthly',
  QUARTERLY:   'Quarterly',
  SEMI_ANNUAL: 'Semi-Annual',
  ANNUAL:      'Annual',
};

export interface BrokerFeeAgreement {
  agreementId: number;
  /** V128 — optimistic-locking token. Must be echoed back unchanged on
   *  update — see @components/smart/optimisticLock. */
  rowVersion: number;
  brokerId: number;
  brokerCode: string;
  brokerName: string;
  agreementCode: string;
  description: string | null;
  commodityType: BfaCommodityType | null;
  productId: number | null;
  productName: string | null;
  tradeType: 'PHYSICAL' | 'FINANCIAL' | null;
  feeType: FeeType;
  feeRate: number;
  feeCurrencyId: number;
  feeCurrencyCode: string;   // denormalized display code, e.g. USD
  uomId: number | null;
  uomCode: string | null;   // denormalized display code, e.g. BBL
  payPeriod: PayPeriod;
  paymentDueDays: number;
  minimumFee: number | null;
  maximumFee: number | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  createdAt: string;
}

export type BrokerFeeAgreementInput = Omit<
  BrokerFeeAgreement,
  'agreementId' | 'brokerCode' | 'brokerName' | 'productName' | 'uomCode' | 'feeCurrencyCode' | 'createdAt'
>;
