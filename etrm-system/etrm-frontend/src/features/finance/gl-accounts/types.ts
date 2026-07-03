import type { CommodityType } from '@features/organization/desks/types';

export interface GlAccount {
  accountId: number;
  accountCode: string;
  accountName: string;
  accountType: string;
  commodityType: CommodityType | null;
  costCenter: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}
export type GlAccountInput = Omit<GlAccount, 'accountId' | 'createdAt'>;
