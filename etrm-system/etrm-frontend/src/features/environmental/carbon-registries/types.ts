export interface CarbonRegistry {
  registryId: number;
  registryCode: string;
  registryName: string;
  registryType: string;
  operator: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: string;
}
export type CarbonRegistryInput = Omit<CarbonRegistry, 'registryId' | 'createdAt'>;
