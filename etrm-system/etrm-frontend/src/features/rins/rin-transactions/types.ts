export interface RinTransaction {
  transactionId: number;
  transactionType: string;      // GENERATE | SEPARATE | TRANSFER_BUY | TRANSFER_SELL | RETIRE
  transactionDate: string;      // ISO date
  accountId: number;
  accountName: string;          // denormalized
  dCode: string;                // D3–D7
  fuelName: string | null;      // denormalized from fuel_category
  vintageYear: number;          // year in which the RINs were originally generated
  quantity: number;             // number of RINs (integer, always positive)
  pricePerRin: number | null;   // USD — only for TRANSFER_BUY / TRANSFER_SELL
  totalValue: number | null;    // quantity × pricePerRin
  counterpartyId: number | null;
  counterpartyName: string | null;
  tradeReference: string | null; // link to physical fuel trade or cargo ref
  batchNumber: string | null;    // EPA batch number format: YYYYMM-XXXXX-NNNNN
  epaTransactionId: string | null; // EPA EMTS confirmation number (for RETIRE / GENERATE)
  obligationId: number | null;   // link to rin_obligation (for RETIRE)
  notes: string | null;
  status: string;               // PENDING | SUBMITTED | CONFIRMED | VOID
  createdAt: string;
}

export type RinTransactionInput = Omit<
  RinTransaction,
  'transactionId' | 'fuelName' | 'accountName' | 'counterpartyName' | 'createdAt'
>;
