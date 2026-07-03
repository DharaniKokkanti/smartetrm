export interface RinAccount {
  accountId: number;
  legalEntityId: number;
  entityName: string;       // denormalized for display
  epaCompanyId: string;     // EPA-assigned company ID (e.g. CO0012345)
  epaFacilityId: string | null; // null = company-level; set for facility-level accounts
  accountCode: string;      // internal code
  accountName: string;
  accountType: string;      // OBLIGATED_PARTY | RENEWABLE_FUEL_PRODUCER | TRADING | EXPORTER
  isActive: boolean;
  createdAt: string;
}

export type RinAccountInput = Omit<RinAccount, 'accountId' | 'entityName' | 'createdAt'>;
