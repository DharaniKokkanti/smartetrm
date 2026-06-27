export const PIPELINE_TYPES = ['CRUDE_OIL', 'REFINED_PRODUCTS', 'NATURAL_GAS', 'LNG', 'NGL', 'HYDROGEN', 'CO2', 'MULTI_PRODUCT'] as const;
export type PipelineType = (typeof PIPELINE_TYPES)[number];

export const PIPELINE_STATUS_CODES = ['OPERATIONAL', 'UNDER_CONSTRUCTION', 'SUSPENDED', 'DECOMMISSIONED'] as const;
export type PipelineStatusCode = (typeof PIPELINE_STATUS_CODES)[number];

export interface Pipeline {
  pipelineId: number;
  pipelineCode: string;
  pipelineName: string;
  pipelineType: PipelineType;
  originLocationId: number | null;
  destinationLocationId: number | null;
  originLocationCode: string | null;
  destinationLocationCode: string | null;
  lengthKm: number | null;
  diameterInch: number | null;
  capacityPerDay: number | null;
  capacityUomCode: string | null;
  tso: string | null;
  regulatoryBody: string | null;
  tariffCurrencyCode: string | null;
  statusCode: PipelineStatusCode;
  isActive: boolean;
  createdAt: string;
}

export type PipelineInput = Omit<Pipeline, 'pipelineId' | 'originLocationCode' | 'destinationLocationCode' | 'createdAt'>;
