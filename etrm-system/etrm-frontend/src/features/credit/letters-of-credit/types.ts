export const LC_TYPES = ['STANDBY', 'DOCUMENTARY', 'REVOLVING', 'TRANSFERABLE'] as const;
export type LcType = (typeof LC_TYPES)[number];

export const LC_STATUSES = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'PARTIALLY_DRAWN', 'FULLY_DRAWN'] as const;
export type LcStatus = (typeof LC_STATUSES)[number];

export interface LetterOfCredit {
  lcId: number;
  /** V128 — optimistic-locking token. Must be echoed back unchanged on
   *  update — see @components/smart/optimisticLock. */
  rowVersion: number;
  lcReference: string;          // bank-issued LC number
  lcType: LcType;
  status: LcStatus;
  counterpartyId: number;       // applicant (who opened the LC)
  counterpartyName: string;
  beneficiaryEntityId: number;  // our legal entity
  beneficiaryEntityName: string;
  issuingBankName: string;
  issuingBankBic: string | null;
  confirmingBankName: string | null;
  lcAmount: number;
  lcCurrencyId: number;
  issuedAmount: number;         // same as lcAmount typically; may differ for revolving
  drawdownAmount: number;       // cumulative amount drawn
  availableAmount: number;      // computed: lcAmount - drawdownAmount
  issueDate: string;
  expiryDate: string;
  presentationDeadlineDays: number | null;  // days before expiry to present docs
  isEvergreen: boolean;
  autoRenewalDays: number | null;           // days before expiry to trigger renewal
  placeOfExpiry: string | null;
  applicableLaw: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type LetterOfCreditInput = Omit<
  LetterOfCredit,
  'lcId' | 'counterpartyName' | 'beneficiaryEntityName' | 'availableAmount' | 'createdAt' | 'updatedAt'
>;
