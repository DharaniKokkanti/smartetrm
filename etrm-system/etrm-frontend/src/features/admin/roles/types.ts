export interface AppModule {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface AppFunction {
  functionId: number;
  moduleId: number;
  moduleCode: string;      // denormalised for display
  moduleName: string;      // denormalised for display
  functionCode: string;
  functionName: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

export type RoleType   = 'SYSTEM' | 'CUSTOM';
export type RoleStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
export type AccessLevel = 'READ' | 'READ_WRITE';
export type AssignmentStatus = 'PENDING_APPROVAL' | 'ACTIVE' | 'REJECTED' | 'EXPIRED';

export interface RoleFunction {
  roleFunctionId: number;
  roleId: number;
  functionId: number;
  functionCode: string;    // denormalised
  accessLevel: AccessLevel;
}

export interface UserRole {
  roleId: number;
  roleCode: string;
  roleName: string;
  description: string | null;
  roleType: RoleType;
  status: RoleStatus;
  rejectionReason: string | null;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  /** Populated on detail fetch */
  functions?: RoleFunction[];
}

export type UserRoleInput = Pick<UserRole, 'roleCode' | 'roleName' | 'description'> & {
  functions: { functionId: number; accessLevel: AccessLevel }[];
};

export interface UserRoleAssignment {
  assignmentId: number;
  userId: number;
  roleId: number;
  roleName: string;        // denormalised
  roleCode: string;        // denormalised
  status: AssignmentStatus;
  assignedBy: string;
  assignedAt: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  validFrom: string;
  validTo: string | null;
  isActive: boolean;
}
