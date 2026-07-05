export const TARIFF_TYPES = ['FIRM', 'INTERRUPTIBLE', 'CAPACITY_BOOKING', 'COMMODITY', 'CONNECTION'] as const;
export type TariffType = (typeof TARIFF_TYPES)[number];

export const CAPACITY_TYPES = ['ENTRY', 'EXIT', 'ENTRY_EXIT', 'WITHIN_ZONE'] as const;
export type CapacityType = (typeof CAPACITY_TYPES)[number];

export const TARIFF_SEASONS = ['SUMMER', 'WINTER', 'ALL'] as const;
export type TariffSeason = (typeof TARIFF_SEASONS)[number];

// Same from/to point simplification as pipeline_segment — dbo.pipeline_point
// has no frontend representation anywhere, so these stay plain text codes.
export interface PipelineTariff {
  tariffId: number;
  pipelineId: number;
  pipelineName: string;
  fromPointCode: string;
  toPointCode: string;
  productId: number | null;
  productName: string | null;
  tariffType: TariffType;
  capacityType: CapacityType;
  currencyId: number;
  currencyCode: string;
  rate: number;
  rateUomId: number;
  rateUomCode: string;
  season: TariffSeason | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  regulatoryRef: string | null;
  isActive: boolean;
  notes: string | null;
}

export type PipelineTariffInput = Omit<PipelineTariff, 'tariffId' | 'pipelineName' | 'productName' | 'currencyCode' | 'rateUomCode'>;
