export interface EnvironmentalProduct {
  productId: number;
  productCode: string;
  productName: string;
  productType: string;
  schemeId: number | null;
  schemeName: string | null;
  registryId: number | null;
  registryName: string | null;
  unitOfMeasure: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  /** V133 — optimistic locking; echo back on update or the save 409s. */
  rowVersion: number;
}
export type EnvironmentalProductInput = Omit<EnvironmentalProduct, 'productId' | 'schemeName' | 'registryName' | 'createdAt'>;
