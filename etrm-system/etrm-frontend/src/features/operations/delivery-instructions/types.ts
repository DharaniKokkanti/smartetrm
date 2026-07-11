export const DELIVERY_INSTRUCTION_TYPES = ['LOADING', 'DISCHARGE', 'RECEIPT', 'DELIVERY'] as const;
export type DeliveryInstructionType = (typeof DELIVERY_INSTRUCTION_TYPES)[number];

export const DELIVERY_INSTRUCTION_STATUSES = [
  'DRAFT', 'ISSUED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED',
] as const;
export type DeliveryInstructionStatus = (typeof DELIVERY_INSTRUCTION_STATUSES)[number];

export interface DeliveryInstruction {
  deliveryInstructionId: number;
  orderId: number;
  orderReference: string | null;
  nominationId: number | null;
  nominationReference: string | null;
  instructionReference: string;
  instructionType: DeliveryInstructionType;
  status: DeliveryInstructionStatus;
  quantity: number;
  uomId: number;
  uomCode: string | null;   // denormalized display code, e.g. BBL
  locationId: number | null;
  locationName: string | null;
  tankId: number | null;
  tankNumber: string | null;
  berth: string | null;
  terminalAgentCounterpartyId: number | null;
  terminalAgentCounterpartyName: string | null;
  scheduledDate: string;
  actualDate: string | null;
  issuedAt: string | null;
  acknowledgedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryInstructionInput = Omit<
  DeliveryInstruction,
  | 'deliveryInstructionId' | 'orderReference' | 'nominationReference' | 'locationName'
  | 'tankNumber' | 'terminalAgentCounterpartyName' | 'uomCode' | 'createdAt' | 'updatedAt'
>;
