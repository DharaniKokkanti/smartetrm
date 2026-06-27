export interface PaymentTerm {
  paymentTermId: number;
  termCode: string;
  termName: string;
  netDays: number;
  discountDays: number | null;
  discountPct: number | null;
  description: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
}

export type PaymentTermInput = Omit<PaymentTerm, 'paymentTermId' | 'createdAt'>;
