export type BookAccessScopeType = 'LEGAL_ENTITY' | 'DESK' | 'BOOK';
export type BookAccessLevel = 'READ' | 'READ_WRITE';
export type BookAccessGrantStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'EXPIRED';

export interface BookAccessGrant {
  grantId: number;
  userId: number;
  userFullName: string;    // denormalised
  username: string;        // denormalised
  scopeType: BookAccessScopeType;
  scopeId: number;
  scopeLabel: string;      // denormalised — the resolved entity/desk/book's code+name
  accessLevel: BookAccessLevel;
  status: BookAccessGrantStatus;
  assignedBy: string;
  assignedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}

export type BookAccessGrantRequest = {
  scopeType: BookAccessScopeType;
  scopeId: number;
  accessLevel: BookAccessLevel;
};
