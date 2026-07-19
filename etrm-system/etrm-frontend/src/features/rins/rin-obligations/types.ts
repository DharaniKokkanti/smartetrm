export interface RinObligation {
  obligationId: number;
  legalEntityId: number;
  entityName: string;
  complianceYear: number;
  dCode: string;
  fuelName: string | null;
  requiredQuantity: number;   // RVO in RINs (Renewable Volume Obligation)
  retiredQuantity: number;    // RINs submitted to EPA via EMTS
  shortfallQuantity: number;  // required − retired (computed/persisted)
  deadline: string | null;    // typically March 31 of the year after compliance year
  status: string;             // OPEN | PARTIALLY_SATISFIED | SATISFIED | OVERDUE
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}

export type RinObligationInput = Omit<
  RinObligation,
  'obligationId' | 'entityName' | 'fuelName' | 'shortfallQuantity' | 'createdAt' | 'updatedAt'
>;
