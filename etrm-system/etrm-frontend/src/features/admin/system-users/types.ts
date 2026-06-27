export const USER_ROLES = ['ADMIN', 'TRADER', 'RISK_MANAGER', 'OPERATIONS', 'COMPLIANCE', 'VIEWER'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface SystemUser {
  userId: number;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  traderId: number | null;
  department: string | null;
  phone: string | null;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

export type SystemUserInput = Omit<SystemUser, 'userId' | 'createdAt' | 'lastLogin'>;
