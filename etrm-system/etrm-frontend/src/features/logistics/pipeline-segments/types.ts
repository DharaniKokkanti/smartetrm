export const OPERATIONAL_STATUSES = ['IN_SERVICE', 'REDUCED_CAPACITY', 'MAINTENANCE', 'OUTAGE', 'DECOMMISSIONED'] as const;
export type OperationalStatus = (typeof OPERATIONAL_STATUSES)[number];

// The real backend links from_point_id/to_point_id to dbo.pipeline_point, a
// table with no frontend representation anywhere in this app yet (no page,
// no mock). Modeled here as plain text point codes rather than inventing a
// dropdown against a concept that doesn't otherwise exist — flagged rather
// than faked, same as other polymorphic/unbuilt-target FK simplifications
// this session.
export interface PipelineSegment {
  segmentId: number;
  pipelineId: number;
  pipelineName: string;
  fromPointCode: string;
  toPointCode: string;
  segmentCode: string;
  segmentName: string | null;
  lengthKm: number | null;
  diameterMm: number | null;
  maxOperatingPressure: number | null;
  forwardCapacity: number | null;
  reverseCapacity: number | null;
  tariffZone: string | null;
  operationalStatus: OperationalStatus;
  isActive: boolean;
  notes: string | null;
}

export type PipelineSegmentInput = Omit<PipelineSegment, 'segmentId' | 'pipelineName'>;
