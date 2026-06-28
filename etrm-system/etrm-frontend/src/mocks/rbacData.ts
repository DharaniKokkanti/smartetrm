import type { AppModule, AppFunction, UserRole, RoleFunction, UserRoleAssignment } from '@features/admin/roles/types';

export const modulesSeed: AppModule[] = [
  { moduleId: 1, moduleCode: 'TRADE',        moduleName: 'Trade Management',       description: 'Create, amend, approve, and cancel trades',                     sortOrder: 1, isActive: true },
  { moduleId: 2, moduleCode: 'COUNTERPARTY', moduleName: 'Counterparty Management',description: 'Manage trading counterparties, KYC, contacts, and bank details', sortOrder: 2, isActive: true },
  { moduleId: 3, moduleCode: 'MASTER_DATA',  moduleName: 'Master Data',            description: 'Legal entities, books, traders, products, and markets',         sortOrder: 3, isActive: true },
  { moduleId: 4, moduleCode: 'STATIC_DATA',  moduleName: 'Static Data',            description: 'Reference lookup tables — currencies, incoterms, types, codes', sortOrder: 4, isActive: true },
  { moduleId: 5, moduleCode: 'POSITION',     moduleName: 'Position & P&L',         description: 'View real-time and historical position and P&L reports',        sortOrder: 5, isActive: true },
  { moduleId: 6, moduleCode: 'PRICING',      moduleName: 'Pricing & Curves',       description: 'Manage price sources, curves, and pricing rules',               sortOrder: 6, isActive: true },
  { moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         description: 'User management, roles, permissions, and system configuration', sortOrder: 7, isActive: true },
];

export const functionsSeed: AppFunction[] = [
  // Trade
  { functionId:  1, moduleId: 1, moduleCode: 'TRADE',        moduleName: 'Trade Management',       functionCode: 'TRADE_VIEW',    functionName: 'View Trades',               description: null, sortOrder: 1, isActive: true },
  { functionId:  2, moduleId: 1, moduleCode: 'TRADE',        moduleName: 'Trade Management',       functionCode: 'TRADE_CREATE',  functionName: 'Create Trades',             description: null, sortOrder: 2, isActive: true },
  { functionId:  3, moduleId: 1, moduleCode: 'TRADE',        moduleName: 'Trade Management',       functionCode: 'TRADE_EDIT',    functionName: 'Edit Trades',               description: null, sortOrder: 3, isActive: true },
  { functionId:  4, moduleId: 1, moduleCode: 'TRADE',        moduleName: 'Trade Management',       functionCode: 'TRADE_APPROVE', functionName: 'Approve Trades',            description: null, sortOrder: 4, isActive: true },
  { functionId:  5, moduleId: 1, moduleCode: 'TRADE',        moduleName: 'Trade Management',       functionCode: 'TRADE_CANCEL',  functionName: 'Cancel Trades',             description: null, sortOrder: 5, isActive: true },
  // Counterparty
  { functionId:  6, moduleId: 2, moduleCode: 'COUNTERPARTY', moduleName: 'Counterparty Management',functionCode: 'CP_VIEW',       functionName: 'View Counterparties',       description: null, sortOrder: 1, isActive: true },
  { functionId:  7, moduleId: 2, moduleCode: 'COUNTERPARTY', moduleName: 'Counterparty Management',functionCode: 'CP_CREATE',     functionName: 'Create Counterparties',     description: null, sortOrder: 2, isActive: true },
  { functionId:  8, moduleId: 2, moduleCode: 'COUNTERPARTY', moduleName: 'Counterparty Management',functionCode: 'CP_EDIT',       functionName: 'Edit Counterparties',       description: null, sortOrder: 3, isActive: true },
  { functionId:  9, moduleId: 2, moduleCode: 'COUNTERPARTY', moduleName: 'Counterparty Management',functionCode: 'CP_DEACTIVATE', functionName: 'Deactivate Counterparties', description: null, sortOrder: 4, isActive: true },
  // Master Data
  { functionId: 10, moduleId: 3, moduleCode: 'MASTER_DATA',  moduleName: 'Master Data',            functionCode: 'MD_VIEW',       functionName: 'View Master Data',          description: null, sortOrder: 1, isActive: true },
  { functionId: 11, moduleId: 3, moduleCode: 'MASTER_DATA',  moduleName: 'Master Data',            functionCode: 'MD_CREATE',     functionName: 'Create Master Data',        description: null, sortOrder: 2, isActive: true },
  { functionId: 12, moduleId: 3, moduleCode: 'MASTER_DATA',  moduleName: 'Master Data',            functionCode: 'MD_EDIT',       functionName: 'Edit Master Data',          description: null, sortOrder: 3, isActive: true },
  { functionId: 13, moduleId: 3, moduleCode: 'MASTER_DATA',  moduleName: 'Master Data',            functionCode: 'MD_DELETE',     functionName: 'Delete Master Data',        description: null, sortOrder: 4, isActive: true },
  // Static Data
  { functionId: 14, moduleId: 4, moduleCode: 'STATIC_DATA',  moduleName: 'Static Data',            functionCode: 'SD_VIEW',       functionName: 'View Static Data',          description: null, sortOrder: 1, isActive: true },
  { functionId: 15, moduleId: 4, moduleCode: 'STATIC_DATA',  moduleName: 'Static Data',            functionCode: 'SD_CREATE',     functionName: 'Create Static Data',        description: null, sortOrder: 2, isActive: true },
  { functionId: 16, moduleId: 4, moduleCode: 'STATIC_DATA',  moduleName: 'Static Data',            functionCode: 'SD_EDIT',       functionName: 'Edit Static Data',          description: null, sortOrder: 3, isActive: true },
  { functionId: 17, moduleId: 4, moduleCode: 'STATIC_DATA',  moduleName: 'Static Data',            functionCode: 'SD_DELETE',     functionName: 'Delete Static Data',        description: null, sortOrder: 4, isActive: true },
  // Position
  { functionId: 18, moduleId: 5, moduleCode: 'POSITION',     moduleName: 'Position & P&L',         functionCode: 'POS_VIEW',      functionName: 'View Positions & P&L',      description: null, sortOrder: 1, isActive: true },
  // Pricing
  { functionId: 19, moduleId: 6, moduleCode: 'PRICING',      moduleName: 'Pricing & Curves',       functionCode: 'PRICE_VIEW',    functionName: 'View Prices & Curves',      description: null, sortOrder: 1, isActive: true },
  { functionId: 20, moduleId: 6, moduleCode: 'PRICING',      moduleName: 'Pricing & Curves',       functionCode: 'PRICE_EDIT',    functionName: 'Edit Prices & Curves',      description: null, sortOrder: 2, isActive: true },
  // Admin
  { functionId: 21, moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         functionCode: 'USER_VIEW',     functionName: 'View Users',                description: null, sortOrder: 1, isActive: true },
  { functionId: 22, moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         functionCode: 'USER_CREATE',   functionName: 'Create Users',              description: null, sortOrder: 2, isActive: true },
  { functionId: 23, moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         functionCode: 'USER_EDIT',     functionName: 'Edit Users',                description: null, sortOrder: 3, isActive: true },
  { functionId: 24, moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         functionCode: 'ROLE_CREATE',   functionName: 'Create Roles',              description: null, sortOrder: 4, isActive: true },
  { functionId: 25, moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         functionCode: 'ROLE_EDIT',     functionName: 'Edit Roles',                description: null, sortOrder: 5, isActive: true },
  { functionId: 26, moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         functionCode: 'ROLE_APPROVE',  functionName: 'Approve Roles',             description: null, sortOrder: 6, isActive: true },
  { functionId: 27, moduleId: 7, moduleCode: 'ADMIN',        moduleName: 'Administration',         functionCode: 'ROLE_ASSIGN',   functionName: 'Assign Roles to Users',     description: null, sortOrder: 7, isActive: true },
];

// ADMIN gets everything READ_WRITE
const adminGrants: RoleFunction[] = functionsSeed.map((f, i) => ({
  roleFunctionId: i + 1, roleId: 1, functionId: f.functionId, functionCode: f.functionCode, accessLevel: 'READ_WRITE',
}));

// TRADER: trade RW (not approve/cancel), others VIEW
const traderFnIds = new Set([1, 2, 3, 6, 10, 14, 18, 19]);
const traderGrants: RoleFunction[] = functionsSeed
  .filter((f) => traderFnIds.has(f.functionId))
  .map((f, i) => ({ roleFunctionId: 100 + i, roleId: 2, functionId: f.functionId, functionCode: f.functionCode, accessLevel: traderFnIds.has(f.functionId) && f.moduleCode === 'TRADE' ? 'READ_WRITE' : 'READ' }));

// RISK_MANAGER: trade view+approve, position full, pricing full, others VIEW
const riskGrants: RoleFunction[] = functionsSeed
  .filter((f) => ['TRADE_VIEW','TRADE_APPROVE','POS_VIEW','PRICE_VIEW','PRICE_EDIT','CP_VIEW','MD_VIEW','SD_VIEW'].includes(f.functionCode))
  .map((f, i) => ({ roleFunctionId: 200 + i, roleId: 3, functionId: f.functionId, functionCode: f.functionCode, accessLevel: 'READ_WRITE' as const }));

// OPERATIONS: CP+MD+SD full, trade/position view
const opsGrants: RoleFunction[] = functionsSeed
  .filter((f) => ['COUNTERPARTY','MASTER_DATA','STATIC_DATA'].includes(f.moduleCode) || ['TRADE_VIEW','POS_VIEW'].includes(f.functionCode))
  .map((f, i) => ({ roleFunctionId: 300 + i, roleId: 4, functionId: f.functionId, functionCode: f.functionCode, accessLevel: ['COUNTERPARTY','MASTER_DATA','STATIC_DATA'].includes(f.moduleCode) ? 'READ_WRITE' : 'READ' }));

// COMPLIANCE: CP full, others view
const complianceGrants: RoleFunction[] = functionsSeed
  .filter((f) => f.moduleCode === 'COUNTERPARTY' || ['TRADE_VIEW','MD_VIEW','SD_VIEW','POS_VIEW'].includes(f.functionCode))
  .map((f, i) => ({ roleFunctionId: 400 + i, roleId: 5, functionId: f.functionId, functionCode: f.functionCode, accessLevel: f.moduleCode === 'COUNTERPARTY' ? 'READ_WRITE' : 'READ' }));

// VIEWER: all VIEW functions, READ
const viewerGrants: RoleFunction[] = functionsSeed
  .filter((f) => f.functionCode.endsWith('_VIEW') || f.functionCode === 'POS_VIEW')
  .map((f, i) => ({ roleFunctionId: 500 + i, roleId: 6, functionId: f.functionId, functionCode: f.functionCode, accessLevel: 'READ' }));

export const roleFunctionsSeed: RoleFunction[] = [
  ...adminGrants, ...traderGrants, ...riskGrants, ...opsGrants, ...complianceGrants, ...viewerGrants,
];

export const rolesSeed: UserRole[] = [
  { roleId: 1, roleCode: 'ADMIN',        roleName: 'System Administrator', description: 'Full access to all modules including administration', roleType: 'SYSTEM', status: 'APPROVED', rejectionReason: null, isActive: true, createdBy: 'SYSTEM', createdAt: '2026-01-01T00:00:00Z', submittedAt: null, approvedBy: 'SYSTEM', approvedAt: '2026-01-01T00:00:00Z', functions: adminGrants },
  { roleId: 2, roleCode: 'TRADER',       roleName: 'Trader',               description: 'Create and manage trades; view counterparties and master data', roleType: 'SYSTEM', status: 'APPROVED', rejectionReason: null, isActive: true, createdBy: 'SYSTEM', createdAt: '2026-01-01T00:00:00Z', submittedAt: null, approvedBy: 'SYSTEM', approvedAt: '2026-01-01T00:00:00Z', functions: traderGrants },
  { roleId: 3, roleCode: 'RISK_MANAGER', roleName: 'Risk Manager',         description: 'View and approve trades; view positions and P&L', roleType: 'SYSTEM', status: 'APPROVED', rejectionReason: null, isActive: true, createdBy: 'SYSTEM', createdAt: '2026-01-01T00:00:00Z', submittedAt: null, approvedBy: 'SYSTEM', approvedAt: '2026-01-01T00:00:00Z', functions: riskGrants },
  { roleId: 4, roleCode: 'OPERATIONS',   roleName: 'Operations',           description: 'Full counterparty and master data management; view trades', roleType: 'SYSTEM', status: 'APPROVED', rejectionReason: null, isActive: true, createdBy: 'SYSTEM', createdAt: '2026-01-01T00:00:00Z', submittedAt: null, approvedBy: 'SYSTEM', approvedAt: '2026-01-01T00:00:00Z', functions: opsGrants },
  { roleId: 5, roleCode: 'COMPLIANCE',   roleName: 'Compliance',           description: 'View and manage KYC/counterparty data; view trades', roleType: 'SYSTEM', status: 'APPROVED', rejectionReason: null, isActive: true, createdBy: 'SYSTEM', createdAt: '2026-01-01T00:00:00Z', submittedAt: null, approvedBy: 'SYSTEM', approvedAt: '2026-01-01T00:00:00Z', functions: complianceGrants },
  { roleId: 6, roleCode: 'VIEWER',       roleName: 'Read-Only Viewer',     description: 'Read-only access to all non-admin modules', roleType: 'SYSTEM', status: 'APPROVED', rejectionReason: null, isActive: true, createdBy: 'SYSTEM', createdAt: '2026-01-01T00:00:00Z', submittedAt: null, approvedBy: 'SYSTEM', approvedAt: '2026-01-01T00:00:00Z', functions: viewerGrants },
  // One custom role in PENDING_APPROVAL state
  { roleId: 7, roleCode: 'CRUDE_TRADER', roleName: 'Crude Oil Trader',     description: 'Crude-specific role with full trade access and read-only positions', roleType: 'CUSTOM', status: 'PENDING_APPROVAL', rejectionReason: null, isActive: true, createdBy: 'john.doe', createdAt: '2026-06-20T09:00:00Z', submittedAt: '2026-06-20T09:05:00Z', approvedBy: null, approvedAt: null, functions: [] },
];

export const assignmentsSeed: UserRoleAssignment[] = [
  { assignmentId: 1, userId: 1, roleId: 1, roleName: 'System Administrator', roleCode: 'ADMIN',   status: 'ACTIVE', assignedBy: 'SYSTEM', assignedAt: '2026-01-01T00:00:00Z', approvedBy: 'SYSTEM', approvedAt: '2026-01-01T00:00:00Z', rejectionReason: null, validFrom: '2026-01-01', validTo: null, isActive: true },
  { assignmentId: 2, userId: 2, roleId: 2, roleName: 'Trader',               roleCode: 'TRADER',  status: 'ACTIVE', assignedBy: 'admin',  assignedAt: '2026-01-15T10:00:00Z', approvedBy: 'admin',  approvedAt: '2026-01-15T10:30:00Z', rejectionReason: null, validFrom: '2026-01-15', validTo: null, isActive: true },
  { assignmentId: 3, userId: 3, roleId: 3, roleName: 'Risk Manager',         roleCode: 'RISK_MANAGER', status: 'ACTIVE', assignedBy: 'admin', assignedAt: '2026-01-15T10:00:00Z', approvedBy: 'admin', approvedAt: '2026-01-15T10:30:00Z', rejectionReason: null, validFrom: '2026-01-15', validTo: null, isActive: true },
  { assignmentId: 4, userId: 4, roleId: 4, roleName: 'Operations',           roleCode: 'OPERATIONS', status: 'PENDING_APPROVAL', assignedBy: 'admin', assignedAt: '2026-06-25T09:00:00Z', approvedBy: null, approvedAt: null, rejectionReason: null, validFrom: '2026-06-25', validTo: null, isActive: true },
];

let nextRoleId = 8;
let nextAssignmentId = 5;
export function nextRoleId_() { return nextRoleId++; }
export function nextAssignmentId_() { return nextAssignmentId++; }
