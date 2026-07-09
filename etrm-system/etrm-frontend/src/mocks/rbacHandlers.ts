import { http, HttpResponse } from 'msw';
import {
  modulesSeed, functionsSeed, rolesStore, roleFunctionsStore, assignmentsStore,
  nextRoleId_, nextAssignmentId_,
} from './rbacData';
import { systemUsersStore } from './etrmHandlers';
import type { UserRole, UserRoleInput, UserRoleAssignment } from '@features/admin/roles/types';

const modules = [...modulesSeed];
const functions = [...functionsSeed];
// Shared live state (mocks/rbacData.ts) — etrmHandlers.ts's admin/users
// handlers read and write these same arrays, not private copies.
const roles = rolesStore;
const roleFunctions = roleFunctionsStore;
const assignments = assignmentsStore;

const API = '/api/v1';
function problem(s: number, t: string, d: string) {
  return HttpResponse.json({ type: 'about:blank', title: t, status: s, detail: d }, { status: s });
}

export const rbacHandlers = [
  // ── Modules ──────────────────────────────────────────────────────────────────
  http.get(`${API}/app-modules`, () => HttpResponse.json(modules)),

  // ── Functions ─────────────────────────────────────────────────────────────────
  http.get(`${API}/app-functions`, () => HttpResponse.json(functions)),

  // ── Roles ─────────────────────────────────────────────────────────────────────
  http.get(`${API}/roles`, () => {
    // attach function counts
    return HttpResponse.json(roles.map((r) => ({
      ...r,
      functionCount: roleFunctions.filter((rf) => rf.roleId === r.roleId).length,
    })));
  }),

  http.get(`${API}/roles/:id`, ({ params }) => {
    const role = roles.find((r) => r.roleId === Number(params.id));
    if (!role) return problem(404, 'Not Found', `Role ${params.id} not found.`);
    return HttpResponse.json({
      ...role,
      functions: roleFunctions.filter((rf) => rf.roleId === role.roleId),
    });
  }),

  http.post(`${API}/roles`, async ({ request }) => {
    const body = (await request.json()) as UserRoleInput;
    const id = nextRoleId_();
    const now = new Date().toISOString();
    const role: UserRole = {
      roleId: id,
      roleCode: body.roleCode,
      roleName: body.roleName,
      description: body.description ?? null,
      roleType: 'CUSTOM',
      status: 'DRAFT',
      rejectionReason: null,
      isActive: true,
      createdBy: 'mock-user',
      createdAt: now,
      submittedAt: null,
      approvedBy: null,
      approvedAt: null,
    };
    roles.push(role);
    // save function grants
    body.functions.forEach((f, i) => {
      const fn = functions.find((x) => x.functionId === f.functionId);
      if (fn) roleFunctions.push({ roleFunctionId: 9000 + id * 100 + i, roleId: id, functionId: f.functionId, functionCode: fn.functionCode, accessLevel: f.accessLevel });
    });
    return HttpResponse.json({ ...role, functions: roleFunctions.filter((rf) => rf.roleId === id) }, { status: 201 });
  }),

  http.put(`${API}/roles/:id`, async ({ params, request }) => {
    const idx = roles.findIndex((r) => r.roleId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Role ${params.id} not found.`);
    if (roles[idx].roleType === 'SYSTEM') return problem(403, 'Forbidden', 'System roles cannot be edited.');
    const body = (await request.json()) as UserRoleInput;
    roles[idx] = { ...roles[idx], roleName: body.roleName, description: body.description ?? null };
    // replace function grants
    const roleId = Number(params.id);
    const kept = roleFunctions.filter((rf) => rf.roleId !== roleId);
    roleFunctions.length = 0; roleFunctions.push(...kept);
    body.functions.forEach((f, i) => {
      const fn = functions.find((x) => x.functionId === f.functionId);
      if (fn) roleFunctions.push({ roleFunctionId: 9000 + roleId * 100 + i, roleId, functionId: f.functionId, functionCode: fn.functionCode, accessLevel: f.accessLevel });
    });
    return HttpResponse.json({ ...roles[idx], functions: roleFunctions.filter((rf) => rf.roleId === roleId) });
  }),

  // ── Workflow: submit for approval ────────────────────────────────────────────
  http.patch(`${API}/roles/:id/submit`, ({ params }) => {
    const idx = roles.findIndex((r) => r.roleId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Role ${params.id} not found.`);
    roles[idx] = { ...roles[idx], status: 'PENDING_APPROVAL', submittedAt: new Date().toISOString() };
    return HttpResponse.json(roles[idx]);
  }),

  // ── Workflow: approve ────────────────────────────────────────────────────────
  http.patch(`${API}/roles/:id/approve`, ({ params }) => {
    const idx = roles.findIndex((r) => r.roleId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Role ${params.id} not found.`);
    roles[idx] = { ...roles[idx], status: 'APPROVED', approvedBy: 'mock-manager', approvedAt: new Date().toISOString() };
    return HttpResponse.json(roles[idx]);
  }),

  // ── Workflow: reject ─────────────────────────────────────────────────────────
  http.patch(`${API}/roles/:id/reject`, async ({ params, request }) => {
    const idx = roles.findIndex((r) => r.roleId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', `Role ${params.id} not found.`);
    const { reason } = (await request.json()) as { reason: string };
    roles[idx] = { ...roles[idx], status: 'REJECTED', rejectionReason: reason ?? null };
    return HttpResponse.json(roles[idx]);
  }),

  // ── User role assignments ────────────────────────────────────────────────────
  http.get(`${API}/users/:userId/role-assignments`, ({ params }) =>
    HttpResponse.json(assignments.filter((a) => a.userId === Number(params.userId) && a.isActive)),
  ),

  http.get(`${API}/role-assignments`, () => HttpResponse.json(assignments)),

  http.post(`${API}/users/:userId/role-assignments`, async ({ params, request }) => {
    const body = (await request.json()) as { roleId: number };
    const role = roles.find((r) => r.roleId === body.roleId);
    if (!role) return problem(404, 'Not Found', `Role ${body.roleId} not found.`);
    if (role.status !== 'APPROVED') return problem(400, 'Bad Request', 'Only APPROVED roles can be assigned.');
    const user = (systemUsersStore as Array<Record<string, unknown>>).find((u) => u['userId'] === Number(params.userId));
    if (!user) return problem(404, 'Not Found', `User ${params.userId} not found.`);
    const existing = assignments.find((a) => a.userId === Number(params.userId) && a.roleId === body.roleId && a.isActive);
    if (existing) return problem(409, 'Conflict', 'User already has this role assignment.');
    const assignment: UserRoleAssignment = {
      assignmentId: nextAssignmentId_(),
      userId: Number(params.userId),
      username: user['username'] as string,
      fullName: user['fullName'] as string,
      roleId: body.roleId,
      roleName: role.roleName,
      roleCode: role.roleCode,
      status: 'PENDING_APPROVAL',
      assignedBy: 'mock-user',
      assignedAt: new Date().toISOString(),
      approvedBy: null,
      approvedAt: null,
      rejectionReason: null,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: null,
      isActive: true,
    };
    assignments.push(assignment);
    return HttpResponse.json(assignment, { status: 201 });
  }),

  http.patch(`${API}/role-assignments/:id/approve`, ({ params }) => {
    const idx = assignments.findIndex((a) => a.assignmentId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', 'Assignment not found.');
    assignments[idx] = { ...assignments[idx], status: 'ACTIVE', approvedBy: 'mock-manager', approvedAt: new Date().toISOString() };
    return HttpResponse.json(assignments[idx]);
  }),

  http.patch(`${API}/role-assignments/:id/reject`, async ({ params, request }) => {
    const idx = assignments.findIndex((a) => a.assignmentId === Number(params.id));
    if (idx === -1) return problem(404, 'Not Found', 'Assignment not found.');
    const { reason } = (await request.json()) as { reason: string };
    assignments[idx] = { ...assignments[idx], status: 'REJECTED', rejectionReason: reason ?? null };
    return HttpResponse.json(assignments[idx]);
  }),

  http.delete(`${API}/users/:userId/role-assignments/:assignmentId`, ({ params }) => {
    const idx = assignments.findIndex((a) => a.assignmentId === Number(params.assignmentId));
    if (idx !== -1) assignments[idx] = { ...assignments[idx], isActive: false, status: 'EXPIRED' };
    return new HttpResponse(null, { status: 204 });
  }),
];
