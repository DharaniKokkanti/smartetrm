export const REGIONS = ['EUROPE', 'AMERICAS', 'ASIA_PACIFIC', 'MIDDLE_EAST', 'AFRICA', 'CIS'] as const;
export type Region = (typeof REGIONS)[number];
export const FATF_STATUSES = ['COMPLIANT', 'GREY_LIST', 'BLACK_LIST'] as const;
export type FatfStatus = (typeof FATF_STATUSES)[number];
export const SANCTION_STATUSES = ['CLEAR', 'OFAC', 'EU_SANCTIONS', 'UN_SANCTIONS'] as const;
export type SanctionStatus = (typeof SANCTION_STATUSES)[number];
export interface Country {
  countryId: number;
  countryCode: string;
  countryName: string;
  region: Region;
  phoneCode: string;
  fatfStatus: FatfStatus;
  sanctionStatus: SanctionStatus;
  isActive: boolean;
}
export type CountryInput = Omit<Country, 'countryId'>;
