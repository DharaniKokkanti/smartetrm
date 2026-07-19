import type { CommodityType } from '@features/reference/commodity-types/types';

// ─── Limit classification ─────────────────────────────────────────────────────
export const CREDIT_LIMIT_TYPES = [
  'PRE_SETTLEMENT',   // potential future exposure on open trades (PFE)
  'SETTLEMENT',       // payment amounts falling due (delivery-vs-payment window)
  'DELIVERY',         // physical delivery risk — cargo released before payment
  'MARK_TO_MARKET',   // current unrealised replacement cost
  'TOTAL_AGGREGATE',  // umbrella cap across all limit types for the counterparty
] as const;
export type CreditLimitType = (typeof CREDIT_LIMIT_TYPES)[number];

// DIRECT = limit granted directly to this counterparty on its own credit standing.
// ALLOCATED = carved out of a parent/group limit (e.g. Shell Group → Shell Trading Intl).
export const LIMIT_BASIS_TYPES = ['DIRECT', 'ALLOCATED'] as const;
export type LimitBasis = (typeof LIMIT_BASIS_TYPES)[number];

export const CREDIT_LIMIT_STATUSES = ['ACTIVE', 'UNDER_REVIEW', 'EXPIRED', 'SUSPENDED', 'CANCELLED'] as const;
export type CreditLimitStatus = (typeof CREDIT_LIMIT_STATUSES)[number];

// Computed traffic light from utilisation vs thresholds
export const LIMIT_INDICATORS = ['OK', 'WARNING', 'CRITICAL', 'BREACHED'] as const;
export type LimitIndicator = (typeof LIMIT_INDICATORS)[number];

// ─── Sub-limits (line items) ──────────────────────────────────────────────────
// Instrument-class carve-outs under the master limit: e.g. a $100M PSR limit
// with $60M available to physical cargoes but only $20M to OTC options.
export const INSTRUMENT_CLASSES = [
  'PHYSICAL',            // physical delivery deals
  'FUTURES',             // exchange-traded futures (margined — lower risk weight)
  'FORWARDS',            // OTC forwards
  'SWAPS',               // fixed/float + basis swaps
  'OPTIONS',             // listed + OTC options
  'STORAGE_TRANSPORT',   // storage and transport agreement deals
] as const;
export type InstrumentClass = (typeof INSTRUMENT_CLASSES)[number];

export interface CreditLimitLineItem {
  lineItemId?: number;
  instrumentClass: InstrumentClass;
  subLimitAmount: number;
  usedAmount: number;
  tenorCapMonths: number | null;   // max deal tenor for this class (null = inherit header)
  notes: string | null;
}

// ─── Governance ───────────────────────────────────────────────────────────────
export const REVIEW_OUTCOMES = ['MAINTAIN', 'INCREASE', 'DECREASE', 'SUSPEND', 'ESCALATE'] as const;
export type ReviewOutcome = (typeof REVIEW_OUTCOMES)[number];

export const COUNTRY_RISK_RATINGS = ['LOW', 'MEDIUM', 'HIGH', 'SEVERE'] as const;
export type CountryRiskRating = (typeof COUNTRY_RISK_RATINGS)[number];

// ─── Monitoring & alerts ──────────────────────────────────────────────────────
export const BREACH_ACTIONS = [
  'ALERT_ONLY',        // notify, trading continues
  'BLOCK_NEW_TRADES',  // existing book stands, new deals with this CP are blocked
  'BLOCK_ALL',         // full trading halt pending credit committee
] as const;
export type BreachAction = (typeof BREACH_ACTIONS)[number];

export const CREDIT_ALERT_TYPES = [
  'WARNING_THRESHOLD',  // utilisation crossed warning %
  'CRITICAL_THRESHOLD', // utilisation crossed critical %
  'BREACH',             // utilisation ≥ 100%
  'REVIEW_DUE',         // next review date reached
  'EXPIRY_APPROACHING', // limit expiry within notice window
  'STATUS_CHANGE',      // suspended / reinstated / cancelled
] as const;
export type CreditAlertType = (typeof CREDIT_ALERT_TYPES)[number];

export const ALERT_RECIPIENTS = ['INTERNAL', 'COUNTERPARTY', 'BOTH'] as const;
export type AlertRecipient = (typeof ALERT_RECIPIENTS)[number];

export interface CreditLimitAlert {
  alertId: number;
  alertType: CreditAlertType;
  recipients: AlertRecipient;
  message: string;
  sentAt: string;
  acknowledgedBy: string | null;
  acknowledgedAt: string | null;
}

// ─── Credit limit ─────────────────────────────────────────────────────────────
export interface CreditLimit {
  creditLimitId: number;
  /** V127 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  counterpartyId: number;
  counterpartyName: string;             // denormalized
  cpCountryId: number | null;           // FK -> dbo.country; denormalized from counterparty — country risk dimension
  countryRiskRating: CountryRiskRating | null;

  // Scope
  limitType: CreditLimitType;
  limitBasis: LimitBasis;
  parentLimitId: number | null;         // set when limitBasis = ALLOCATED
  commodityType: CommodityType | 'ALL'; // limit can be commodity-specific or umbrella

  // Amounts
  limitAmount: number;
  limitCurrencyId: number;
  usedAmount: number;
  availableAmount: number;              // computed: limit + uplift + collateral − used
  utilisationPct: number;               // computed
  collateralOffset: number;             // LC / PCG value that reduces net exposure
  collateralRef: string | null;         // e.g. LC-2026-0007, PCG-SHELL-01
  tempUpliftAmount: number | null;      // temporary increase on top of limitAmount
  tempUpliftExpiry: string | null;      // uplift falls away after this date
  tenorCapMonths: number | null;        // max deal tenor bookable under this limit

  // Validity
  effectiveDate: string;
  expiryDate: string | null;

  // Governance
  creditAnalystUserId: number | null;
  creditAnalystName: string | null;     // denormalized
  approvedBy: string | null;
  approvalDate: string | null;
  reviewFrequencyDays: number | null;   // 90 / 180 / 365
  lastReviewDate: string | null;
  nextReviewDate: string | null;        // auto: lastReviewDate + reviewFrequencyDays
  lastReviewOutcome: ReviewOutcome | null;
  internalRating: string | null;        // internal grade at last review (e.g. IR-3)
  externalRating: string | null;        // S&P / Moody's / Fitch (e.g. A-, Baa1)

  // Monitoring & alerts
  warningThresholdPct: number;          // default 80
  criticalThresholdPct: number;         // default 95
  breachAction: BreachAction;
  alertInternal: boolean;               // notify credit analyst + desk on threshold events
  alertCounterparty: boolean;           // send limit status notices to the counterparty
  cpAlertEmail: string | null;          // CP credit-contact email for status notices
  limitIndicator: LimitIndicator;       // computed traffic light

  // Sub-limits & history
  lineItems: CreditLimitLineItem[];
  alerts?: CreditLimitAlert[];          // read-only event history

  status: CreditLimitStatus;
  nettingAgreementRef: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreditLimitInput = Omit<
  CreditLimit,
  'creditLimitId' | 'counterpartyName' | 'creditAnalystName' | 'availableAmount'
  | 'utilisationPct' | 'limitIndicator' | 'alerts' | 'createdAt' | 'updatedAt'
>;
