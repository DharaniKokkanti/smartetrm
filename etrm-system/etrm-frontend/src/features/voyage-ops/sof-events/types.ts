export interface VoyageSofEvent {
  sofEventId: number;
  voyageId: number;
  portLocationId: number;
  portLocationName: string | null;
  portCallSequence: number;
  sofEventTypeId: number;
  eventCode: string | null;
  eventTimestamp: string;
  remarks: string | null;
  isManualEntry: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export type VoyageSofEventInput = Omit<
  VoyageSofEvent,
  'sofEventId' | 'portLocationName' | 'eventCode' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'
>;
