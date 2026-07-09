// This file used to define its own USER_ROLES/UserRole — a flat, hardcoded
// 6-value string with zero connection to the real RBAC system (dbo.user_role
// / dbo.user_role_assignment, @features/admin/roles). dbo.app_user has no
// role column at all; a user's real roles live entirely in
// user_role_assignment, and a user can hold more than one at once (the
// table's uniqueness constraint is on (user_id, role_id), not user_id
// alone) — so `roles` below is an array, denormalized from every ACTIVE /
// PENDING_APPROVAL assignment the user currently holds (mocks/rbacData.ts's
// assignmentsStore), the same way every other denormalized field works.
export interface SystemUserRoleSummary {
  assignmentId: number;
  roleId: number;
  roleCode: string;
  roleName: string;
  status: 'PENDING_APPROVAL' | 'ACTIVE';
}

export interface SystemUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  /** Every role this user currently holds — empty array if none assigned yet.
   *  Additional roles are granted via Roles & Permissions → User Assignments
   *  ("Assign Role"), not by editing the user record. */
  roles: SystemUserRoleSummary[];
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

/** roleId here is create-only — it requests the user's first role assignment,
 *  same pending-approval path as any other assignment. Not present on
 *  SystemUser itself since a user's roles are a list, not one input field. */
export type SystemUserInput = Omit<SystemUser, 'userId' | 'createdAt' | 'lastLogin' | 'roles'> & { roleId?: number };
