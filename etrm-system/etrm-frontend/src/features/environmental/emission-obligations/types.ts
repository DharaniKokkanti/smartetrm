export interface EmissionObligation {
  obligationId: number;
  legalEntityId: number;
  entityName: string;
  schemeId: number;
  schemeName: string;
  obligationYear: number;
  verifiedEmissions: number | null;
  allowancesHeld: number | null;
  shortfallUnits: number | null;
  surrenderDeadline: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}
export type EmissionObligationInput = Omit<EmissionObligation, 'obligationId' | 'entityName' | 'schemeName' | 'shortfallUnits' | 'createdAt'>;
