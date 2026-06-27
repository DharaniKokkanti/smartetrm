export const INCOTERM_VERSIONS = ['INCOTERMS_2020', 'INCOTERMS_2010'] as const;
export type IncotermVersion = (typeof INCOTERM_VERSIONS)[number];
export const TRANSPORT_MODES = ['ANY', 'SEA_INLAND', 'ANY_EXCEPT_SEA'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];
export interface Incoterm {
  incotermId: number;
  incotermCode: string;
  incotermName: string;
  version: IncotermVersion;
  transportMode: TransportMode;
  riskTransferPoint: string;
  costResponsibility: string;
  titleTransfer: string | null;
  isActive: boolean;
}
export type IncotermInput = Omit<Incoterm, 'incotermId'>;
