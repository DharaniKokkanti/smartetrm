export const CERT_TYPES = [
  'SIRE', 'CDI', 'PI_INSURANCE', 'HULL_INSURANCE', 'CLASS_CERT', 'ISM',
  'ISPS', 'MARPOL', 'USCG', 'RIGHTSHIP', 'ITOPF', 'OTHER',
] as const;
export type CertType = (typeof CERT_TYPES)[number];

export interface VesselCertificate {
  certId: number;
  /** V132 — optimistic-locking token, echoed back unchanged on update. See @components/smart/optimisticLock. */
  rowVersion: number;
  vesselId: number;
  vesselName: string;
  certType: CertType;
  certNumber: string | null;
  issuingBody: string | null;
  issueDate: string | null;
  expiryDate: string | null;
  isCurrent: boolean;
  notes: string | null;
  createdAt: string;
}

export type VesselCertificateInput = Omit<VesselCertificate, 'certId' | 'vesselName' | 'createdAt'>;
