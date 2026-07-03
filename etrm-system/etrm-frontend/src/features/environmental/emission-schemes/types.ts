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
}
export type EmissionSchemeInput = Omit<EmissionScheme, 'schemeId' | 'createdAt'>;
