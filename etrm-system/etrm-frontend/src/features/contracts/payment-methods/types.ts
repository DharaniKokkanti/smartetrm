export const PAYMENT_METHOD_TYPES = ['WIRE', 'SWIFT', 'SEPA', 'ACH', 'NETTING', 'LETTER_OF_CREDIT', 'BANK_GUARANTEE'] as const;
export type PaymentMethodType = (typeof PAYMENT_METHOD_TYPES)[number];

export interface PaymentMethod {
  paymentMethodId: number;
  methodCode: string;
  methodName: string;
  methodType: PaymentMethodType;
  currencyRestriction: string | null;
  processingDays: number;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}

export type PaymentMethodInput = Omit<PaymentMethod, 'paymentMethodId' | 'createdAt'>;
