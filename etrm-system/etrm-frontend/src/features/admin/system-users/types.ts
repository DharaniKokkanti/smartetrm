// V79 follow-up: this file used to define its own USER_ROLES/UserRole — a
// flat, hardcoded 6-value string with zero connection to the real RBAC
// system (dbo.user_role / dbo.user_role_assignment, @features/admin/roles).
// dbo.app_user has no role column at all; a user's real role lives entirely
// in user_role_assignment. That fake field is gone — roleId/roleCode/
// roleName/assignmentStatus below are denormalized from the user's current
// assignment (mocks/rbacData.ts's assignmentsStore), the same way every
// other denormalized display field in this app works.
export interface SystemUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  /** Current role assignment, denormalized. null = no role assigned yet. */
  roleId: number | null;
  roleCode: string | null;
  roleName: string | null;
  /** Status of the current assignment — PENDING_APPROVAL until someone
   *  approves it on the Roles & Permissions "User Assignments" tab. */
  assignmentStatus: 'PENDING_APPROVAL' | 'ACTIVE' | null;
  traderId: number | null;
  department: string | null;
  phone: string | null;
  /** BCP 47 locale tag, e.g. en-GB, fr-FR — drives date/number formatting */
  preferredLocale: string | null;
  /** Office location / city, e.g. London, Singapore */
  officeLocation: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export type SystemUserInput = Omit<SystemUser, 'userId' | 'createdAt' | 'lastLogin' | 'roleCode' | 'roleName' | 'assignmentStatus'>;
