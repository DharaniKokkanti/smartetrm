export const CONTAINER_TYPES = ['ISO_TANK', 'FLEXIBAG', 'DRY_BULK', 'REEFER', 'STANDARD', 'OTHER'] as const;
export type ContainerType = (typeof CONTAINER_TYPES)[number];

export interface Container {
  containerId: number;
  containerNumber: string;
  containerType: ContainerType;
  operatorId: number;
  operatorName: string;
  capacityLitres: number | null;
  capacityMt: number | null;
  tareWeightKg: number | null;
  maxGrossWeightKg: number | null;
  unApproval: string | null;
  approvedCommodities: string | null;
  cscPlateExpiry: string | null;
  lastInspectionDate: string | null;
  nextInspectionDate: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
}

export type ContainerInput = Omit<Container, 'containerId' | 'operatorName' | 'createdAt'>;
