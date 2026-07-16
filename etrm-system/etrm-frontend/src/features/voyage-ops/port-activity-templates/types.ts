export interface PortActivityTemplateStep {
  stepId: number;
  templateId: number;
  sofEventTypeId: number;
  eventCode: string | null;
  stepSequence: number;
  typicalDurationHours: number | null;
  notes: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type PortActivityTemplateStepInput = Omit<
  PortActivityTemplateStep,
  'stepId' | 'eventCode' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
