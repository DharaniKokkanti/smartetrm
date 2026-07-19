export interface EmissionScheme {
  schemeId: number;
  schemeCode: string;
  schemeName: string;
  schemeType: string;
  regulator: string | null;
  jurisdiction: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}
export type EmissionSchemeInput = Omit<EmissionScheme, 'schemeId' | 'createdAt'>;
