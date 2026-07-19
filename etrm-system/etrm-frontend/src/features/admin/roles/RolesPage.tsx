import { useState, useEffect, useMemo } from 'react';
import {
  Table, Button, Tag, Badge, Space, Modal, Form, Input, Checkbox, Tooltip,
  Typography, Divider, Popconfirm, Tabs, Alert, Spin, Row, Col, Select,
  App as AntApp,
} from 'antd';
import {
  PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined,
  SendOutlined, LockOutlined, UnlockOutlined, UserAddOutlined, SearchOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AppFunction, AppModule, RoleStatus, RoleType, AssignmentStatus, UserRole, UserRoleAssignment } from './types';
import {
  useRoles, useRoleDetail, useModules, useFunctions,
  useCreateRole, useUpdateRole, useSubmitRole, useApproveRole, useRejectRole,
  useAssignments, useAssignRole, useApproveAssignment, useRejectAssignment, useRevokeAssignment,
} from './hooks';
import { fetchRole } from './api';
import { useSystemUsers } from '@features/admin/system-users/hooks';
import { useDraftState, useDraftValues } from '@components/smart/formDraft';
import { hint } from '@components/smart/FieldHint';
import { PageHeader } from '@components/layout/PageHeader';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useBooks } from '@features/organization/books/hooks';
import {
  useBookAccessGrants, useRequestBookAccessGrant,
  useApproveBookAccessGrant, useRejectBookAccessGrant, useRevokeBookAccessGrant,
} from '@features/admin/bookaccess/hooks';
import type { BookAccessGrant, BookAccessGrantStatus, BookAccessScopeType, BookAccessLevel } from '@features/admin/bookaccess/types';

const { Text } = Typography;

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<RoleStatus, string> = {
  DRAFT: 'default',
  PENDING_APPROVAL: 'orange',
  APPROVED: 'green',
  REJECTED: 'red',
};

function RoleStatusTag({ status }: { status: RoleStatus }) {
  return <Tag color={STATUS_COLOR[status]}>{status.replace('_', ' ')}</Tag>;
}

// ── Function matrix modal ─────────────────────────────────────────────────────
interface FunctionMatrixProps {
  modules: AppModule[];
  functions: AppFunction[];
  value: Map<number, 'READ' | 'READ_WRITE'>;
  onChange: (next: Map<number, 'READ' | 'READ_WRITE'>) => void;
  disabled?: boolean;
}

function FunctionMatrix({ modules, functions, value, onChange, disabled }: FunctionMatrixProps) {
  function toggle(fnId: number, level: 'READ' | 'READ_WRITE') {
    const next = new Map(value);
    const cur = next.get(fnId);
    if (cur === level) {
      next.delete(fnId);
    } else {
      next.set(fnId, level);
    }
    onChange(next);
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.04)' }}>
            <th style={{ textAlign: 'left', padding: '6px 12px', fontWeight: 600 }}>Function</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', width: 80, fontWeight: 600 }}>Read</th>
            <th style={{ textAlign: 'center', padding: '6px 12px', width: 100, fontWeight: 600 }}>Read+Write</th>
          </tr>
        </thead>
        <tbody>
          {modules.map((mod) => {
            const modFns = functions.filter((f) => f.moduleId === mod.moduleId);
            if (!modFns.length) return null;
            return [
              <tr key={`mod-${mod.moduleId}`}>
                <td
                  colSpan={3}
                  style={{
                    padding: '8px 12px 4px',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    color: '#6b7280',
                    borderTop: '1px solid rgba(0,0,0,0.08)',
                  }}
                >
                  {mod.moduleName}
                </td>
              </tr>,
              ...modFns.map((fn) => {
                const cur = value.get(fn.functionId);
                return (
                  <tr key={fn.functionId} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <td style={{ padding: '5px 12px' }}>{fn.functionName}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={cur === 'READ' || cur === 'READ_WRITE'}
                        disabled={disabled}
                        onChange={() => {
                          if (cur === 'READ_WRITE') toggle(fn.functionId, 'READ');
                          else toggle(fn.functionId, 'READ');
                        }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={cur === 'READ_WRITE'}
                        disabled={disabled}
                        onChange={() => toggle(fn.functionId, 'READ_WRITE')}
                      />
                    </td>
                  </tr>
                );
              }),
            ];
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Reject modal ──────────────────────────────────────────────────────────────
function RejectModal({
  open, onOk, onCancel, loading,
}: { open: boolean; onOk: (reason: string) => void; onCancel: () => void; loading: boolean }) {
  const [reason, setReason] = useState('');
  return (
    <Modal mask={false} forceRender
      open={open}
      title="Reject Role"
      onCancel={onCancel}
      onOk={() => { onOk(reason); setReason(''); }}
      okButtonProps={{ danger: true, loading, disabled: !reason.trim() }}
      okText="Reject"
      destroyOnHidden
    >
      <Form.Item label="Reason" required style={{ marginTop: 16 }}>
        <Input.TextArea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Enter reason for rejection..."
        />
      </Form.Item>
    </Modal>
  );
}

// ── Create / Edit role modal ──────────────────────────────────────────────────
interface RoleFormModalProps {
  open: boolean;
  editing: UserRole | null;
  modules: AppModule[];
  functions: AppFunction[];
  onClose: () => void;
}

function RoleFormModal({ open, editing, modules, functions, onClose }: RoleFormModalProps) {
  const [form] = Form.useForm();
  const { message } = AntApp.useApp();
  const skipDraftReset = useDraftValues('admin-roles-v', form, open, editing);
  const { data: detail } = useRoleDetail(editing?.roleId ?? null);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const saving = createRole.isPending || updateRole.isPending;

  const [grantMap, setGrantMap] = useState<Map<number, 'READ' | 'READ_WRITE'>>(new Map());

  // Seed grantMap when role detail loads — genuine sync-with-external-query-data effect.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (detail?.functions) {
      const m = new Map<number, 'READ' | 'READ_WRITE'>();
      detail.functions.forEach((rf) => m.set(rf.functionId, rf.accessLevel));
      setGrantMap(m);
    }
  }, [detail]);

  // Reset when switching between roles (or create vs edit)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability -- skipDraftReset is a useRef() from useDraftValues; the compiler cannot see refs through a custom hook boundary
    if (skipDraftReset.current) { if (open) skipDraftReset.current = false; return; }
    if (!editing) {
      form.resetFields();
      setGrantMap(new Map());
    } else {
      form.setFieldsValue({ roleCode: editing.roleCode, roleName: editing.roleName, description: editing.description });
    }
  }, [editing, form, open]);
  /* eslint-enable react-hooks/set-state-in-effect */

  async function handleOk() {
    const vals = await form.validateFields();
    const fnList = [...grantMap.entries()].map(([functionId, accessLevel]) => ({ functionId, accessLevel }));
    const input = { roleCode: vals.roleCode, roleName: vals.roleName, description: vals.description ?? null, functions: fnList };
    if (editing) {
      // V133 — echo back the version last read (from the roles list, which
      // already carries it), or the save 409s as a stale-version conflict.
      await updateRole.mutateAsync({ id: editing.roleId, input: { ...input, rowVersion: editing.rowVersion } });
    } else {
      await createRole.mutateAsync(input);
    }
    form.resetFields();
    setGrantMap(new Map());
    onClose();
  }

  const [mirrorSourceId, setMirrorSourceId] = useState<number | null>(null);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const { data: allRoles = [] } = useRoles();
  const mirrorOptions = allRoles
    .filter((r) => r.roleId !== editing?.roleId)
    .map((r) => ({ value: r.roleId, label: `${r.roleCode} — ${r.roleName}` }));

  async function handleMirror() {
    if (mirrorSourceId === null) return;
    setMirrorLoading(true);
    try {
      const source = await fetchRole(mirrorSourceId);
      const m = new Map<number, 'READ' | 'READ_WRITE'>();
      source.functions.forEach((rf) => m.set(rf.functionId, rf.accessLevel));
      setGrantMap(m);
      message.success(`Copied ${source.functions.length} permission(s) from ${mirrorOptions.find((o) => o.value === mirrorSourceId)?.label ?? 'the selected role'}. Review below, then save.`);
    } catch {
      message.error('Failed to load permissions from the selected role.');
    } finally {
      setMirrorLoading(false);
    }
  }

  const isSystem = editing?.roleType === 'SYSTEM';

  return (
    <Modal mask={false} forceRender
      open={open}
      title={editing ? `Edit Role — ${editing.roleCode}` : 'Create Custom Role'}
      width={700}
      onCancel={() => { form.resetFields(); setGrantMap(new Map()); onClose(); }}
      onOk={handleOk}
      okButtonProps={{ loading: saving, disabled: isSystem }}
      okText={editing ? 'Save Changes' : 'Create Role'}
      destroyOnHidden
    >
      {isSystem && <Alert message="System roles cannot be edited." type="info" showIcon style={{ marginBottom: 16 }} />}
      <Form
        form={form}
        layout="vertical"
        initialValues={{ roleCode: editing?.roleCode, roleName: editing?.roleName, description: editing?.description }}
      >
        <Row gutter={12}>
          <Col span={10}>
            <Form.Item
              name="roleCode"
              label={hint('Role Code', 'Short unique identifier for this custom role — always stored uppercase. System roles are seeded and cannot be edited or created here.', 'CRUDE_TRADER')}
              rules={[{ required: true }, { max: 30 }]}
            >
              <Input placeholder="e.g. CRUDE_TRADER" maxLength={30} showCount disabled={!!editing || isSystem} style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Col>
          <Col span={14}>
            <Form.Item name="roleName" label="Role Name" rules={[{ required: true }, { max: 100 }]}>
              <Input placeholder="e.g. Crude Oil Trader" disabled={isSystem} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} maxLength={500} showCount disabled={isSystem} />
        </Form.Item>
      </Form>

      <Divider style={{ margin: '8px 0 12px' }}>Function Permissions</Divider>
      {!isSystem && (
        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
          <Select
            showSearch
            placeholder="Mirror permissions from another role…"
            style={{ width: '100%' }}
            options={mirrorOptions}
            optionFilterProp="label"
            value={mirrorSourceId}
            onChange={setMirrorSourceId}
          />
          <Button onClick={handleMirror} loading={mirrorLoading} disabled={mirrorSourceId === null}>
            Copy Permissions
          </Button>
        </Space.Compact>
      )}
      {detail === undefined && editing ? (
        <Spin />
      ) : (
        <FunctionMatrix
          modules={modules}
          functions={functions}
          value={grantMap}
          onChange={setGrantMap}
          disabled={isSystem}
        />
      )}
    </Modal>
  );
}

// ── Assign role modal ─────────────────────────────────────────────────────────
// A user can hold more than one role at once (user_role_assignment's
// uniqueness is on (user_id, role_id), not user_id alone) — this is the one
// place in the app that grants an ADDITIONAL role to an existing user; the
// System Users page only requests a user's first role, at creation.
interface AssignRoleModalProps { open: boolean; onClose: () => void }

function AssignRoleModal({ open, onClose }: AssignRoleModalProps) {
  const [form] = Form.useForm<{ userId: number; roleId: number }>();
  const { data: users = [] } = useSystemUsers();
  const { data: roles = [] } = useRoles();
  const assignableRoles = roles.filter((r) => r.status === 'APPROVED');
  const assignRole = useAssignRole();

  async function handleOk() {
    const vals = await form.validateFields();
    await assignRole.mutateAsync(vals, { onSuccess: () => { form.resetFields(); onClose(); } });
  }

  return (
    <Modal mask={false} forceRender
      open={open}
      title="Assign Role to User"
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      okButtonProps={{ loading: assignRole.isPending }}
      okText="Request Assignment"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="userId" label="User" rules={[{ required: true, message: 'User is required' }]}>
          <Select
            showSearch
            placeholder="Select user"
            optionFilterProp="label"
            options={users.map((u) => ({ label: `${u.fullName} (${u.username})`, value: u.userId }))}
          />
        </Form.Item>
        <Form.Item
          name="roleId"
          label={hint('Role', 'Goes to Roles & Permissions → User Assignments for approval before it takes effect. A user already holding this role cannot be assigned it again.')}
          rules={[{ required: true, message: 'Role is required' }]}
        >
          <Select
            placeholder="Select role"
            options={assignableRoles.map((r) => ({ label: r.roleName, value: r.roleId }))}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Request book access modal ─────────────────────────────────────────────────
const SCOPE_TYPE_OPTIONS: { label: string; value: BookAccessScopeType }[] = [
  { label: 'Legal Entity', value: 'LEGAL_ENTITY' },
  { label: 'Book', value: 'BOOK' },
];

const ACCESS_LEVEL_OPTIONS: { label: string; value: BookAccessLevel }[] = [
  { label: 'Read', value: 'READ' },
  { label: 'Read-Write', value: 'READ_WRITE' },
];

const GRANT_STATUS_COLOR: Record<BookAccessGrantStatus, string> = {
  ACTIVE: 'green',
  PENDING_APPROVAL: 'orange',
  REJECTED: 'red',
  EXPIRED: 'default',
};

interface RequestAccessModalProps { open: boolean; onClose: () => void }

function RequestAccessModal({ open, onClose }: RequestAccessModalProps) {
  const [form] = Form.useForm<{ userId: number; scopeType: BookAccessScopeType; scopeId: number; accessLevel: BookAccessLevel }>();
  const { data: users = [] } = useSystemUsers();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: books = [] } = useBooks();
  const requestGrant = useRequestBookAccessGrant();

  const scopeType = Form.useWatch('scopeType', form);

  const scopeTargetOptions = useMemo(() => {
    if (scopeType === 'LEGAL_ENTITY') return legalEntities.map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }));
    if (scopeType === 'BOOK') return books.map((b) => ({ label: `${b.bookCode} — ${b.bookName}`, value: b.bookId }));
    return [];
  }, [scopeType, legalEntities, books]);

  async function handleOk() {
    const vals = await form.validateFields();
    await requestGrant.mutateAsync({
      userId: vals.userId,
      input: { scopeType: vals.scopeType, scopeId: vals.scopeId, accessLevel: vals.accessLevel },
    }, { onSuccess: () => { form.resetFields(); onClose(); } });
  }

  return (
    <Modal mask={false} forceRender
      open={open}
      title="Request Book Access"
      onCancel={() => { form.resetFields(); onClose(); }}
      onOk={handleOk}
      okButtonProps={{ loading: requestGrant.isPending }}
      okText="Request Access"
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="userId" label="User" rules={[{ required: true, message: 'User is required' }]}>
          <Select
            showSearch
            placeholder="Select user"
            optionFilterProp="label"
            options={users.map((u) => ({ label: `${u.fullName} (${u.username})`, value: u.userId }))}
          />
        </Form.Item>
        <Form.Item name="scopeType" label="Scope Type" rules={[{ required: true, message: 'Scope type is required' }]}>
          <Select
            placeholder="Select scope"
            options={SCOPE_TYPE_OPTIONS}
            onChange={() => form.setFieldValue('scopeId', undefined)}
          />
        </Form.Item>
        <Form.Item
          name="scopeId"
          label={hint('Scope Target', 'The specific legal entity or book (including Desk/Strategy-level rows) this access grant applies to.')}
          rules={[{ required: true, message: 'Scope target is required' }]}
        >
          <Select
            showSearch
            optionFilterProp="label"
            placeholder={scopeType ? 'Select target' : 'Select a scope type first'}
            disabled={!scopeType}
            options={scopeTargetOptions}
          />
        </Form.Item>
        <Form.Item name="accessLevel" label="Access Level" rules={[{ required: true, message: 'Access level is required' }]}>
          <Select placeholder="Select access level" options={ACCESS_LEVEL_OPTIONS} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function RolesPage() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: modules = [] } = useModules();
  const { data: functions = [] } = useFunctions();
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignments();
  const { data: bookAccessGrants = [], isLoading: bookAccessGrantsLoading } = useBookAccessGrants();

  const submitRole = useSubmitRole();
  const approveRole = useApproveRole();
  const rejectRole = useRejectRole();
  const approveAssignment = useApproveAssignment();
  const rejectAssignment = useRejectAssignment();
  const revokeAssignment = useRevokeAssignment();
  const approveBookAccessGrant = useApproveBookAccessGrant();
  const rejectBookAccessGrant = useRejectBookAccessGrant();
  const revokeBookAccessGrant = useRevokeBookAccessGrant();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  useDraftState('admin-roles', { open: formOpen, setOpen: setFormOpen, editing: editingRole, setEditing: setEditingRole });
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectAssignmentOpen, setRejectAssignmentOpen] = useState(false);
  const [rejectAssignmentTarget, setRejectAssignmentTarget] = useState<number | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [requestAccessOpen, setRequestAccessOpen] = useState(false);
  const [bookAccessSearch, setBookAccessSearch] = useState('');
  const [rejectGrantOpen, setRejectGrantOpen] = useState(false);
  const [rejectGrantTarget, setRejectGrantTarget] = useState<number | null>(null);

  function openCreate() { setEditingRole(null); setFormOpen(true); }
  function openEdit(r: UserRole) { setEditingRole(r); setFormOpen(true); }

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) =>
      r.roleCode.toLowerCase().includes(q) ||
      r.roleName.toLowerCase().includes(q) ||
      (r.description ?? '').toLowerCase().includes(q));
  }, [roles, roleSearch]);

  const filteredAssignments = useMemo(() => {
    const q = assignmentSearch.trim().toLowerCase();
    if (!q) return assignments;
    return assignments.filter((a) =>
      a.fullName.toLowerCase().includes(q) ||
      a.username.toLowerCase().includes(q) ||
      a.roleName.toLowerCase().includes(q) ||
      a.roleCode.toLowerCase().includes(q));
  }, [assignments, assignmentSearch]);

  const filteredBookAccessGrants = useMemo(() => {
    const q = bookAccessSearch.trim().toLowerCase();
    if (!q) return bookAccessGrants;
    return bookAccessGrants.filter((g) =>
      g.userFullName.toLowerCase().includes(q) ||
      g.username.toLowerCase().includes(q) ||
      g.scopeLabel.toLowerCase().includes(q));
  }, [bookAccessGrants, bookAccessSearch]);

  const roleColumns: ColumnsType<UserRole> = [
    {
      title: 'Code',
      dataIndex: 'roleCode',
      width: 160,
      render: (v, r) => (
        <Space size={4}>
          {r.roleType === 'SYSTEM' ? <LockOutlined style={{ color: '#6b7280' }} /> : <UnlockOutlined style={{ color: '#3b82f6' }} />}
          <Text strong style={{ fontFamily: 'monospace' }}>{v}</Text>
        </Space>
      ),
    },
    { title: 'Name', dataIndex: 'roleName' },
    {
      title: 'Type',
      dataIndex: 'roleType',
      width: 90,
      render: (v) => <Tag color={v === 'SYSTEM' ? 'purple' : 'blue'}>{v}</Tag>,
      filters: (['SYSTEM', 'CUSTOM'] as RoleType[]).map((v) => ({ text: v, value: v })),
      onFilter: (value, r) => r.roleType === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 155,
      render: (v: RoleStatus) => <RoleStatusTag status={v} />,
      filters: (['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as RoleStatus[]).map((v) => ({ text: v.replace('_', ' '), value: v })),
      onFilter: (value, r) => r.status === value,
    },
    {
      title: 'Functions',
      dataIndex: 'functionCount',
      width: 90,
      align: 'right',
      render: (v) => <Badge count={v ?? 0} color="blue" showZero />,
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      width: 120,
      render: (v) => <Text type="secondary">{v}</Text>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          </Tooltip>
          {r.status === 'DRAFT' && r.roleType === 'CUSTOM' && (
            <Tooltip title="Submit for approval">
              <Popconfirm title="Submit this role for manager approval?" onConfirm={() => submitRole.mutate(r.roleId)}>
                <Button size="small" icon={<SendOutlined />} />
              </Popconfirm>
            </Tooltip>
          )}
          {r.status === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Approve">
                <Popconfirm title="Approve this role?" onConfirm={() => approveRole.mutate(r.roleId)}>
                  <Button size="small" icon={<CheckOutlined />} type="primary" />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Reject">
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => { setRejectTarget(r.roleId); setRejectOpen(true); }}
                />
              </Tooltip>
            </>
          )}
        </Space>
      ),
    },
  ];

  const assignmentColumns: ColumnsType<UserRoleAssignment> = [
    {
      title: 'User',
      dataIndex: 'fullName',
      width: 200,
      render: (v, r) => <><Text strong>{v}</Text> <Text type="secondary" style={{ fontFamily: 'monospace' }}>({r.username})</Text></>,
    },
    { title: 'Role', dataIndex: 'roleName', render: (v, r) => <><Text strong>{v}</Text> <Tag style={{ marginLeft: 4 }}>{r.roleCode}</Tag></> },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 155,
      render: (v) => {
        const color = v === 'ACTIVE' ? 'green' : v === 'PENDING_APPROVAL' ? 'orange' : v === 'REJECTED' ? 'red' : 'default';
        return <Tag color={color}>{v.replace('_', ' ')}</Tag>;
      },
      filters: (['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'EXPIRED'] as AssignmentStatus[]).map((v) => ({ text: v.replace('_', ' '), value: v })),
      onFilter: (value, a) => a.status === value,
    },
    { title: 'Assigned By', dataIndex: 'assignedBy', width: 120, render: (v) => <Text type="secondary">{v}</Text> },
    { title: 'Valid From', dataIndex: 'validFrom', width: 110 },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, a) => (
        <Space size={4}>
          {a.status === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Approve assignment">
                <Popconfirm title="Approve this role assignment?" onConfirm={() => approveAssignment.mutate(a.assignmentId)}>
                  <Button size="small" icon={<CheckOutlined />} type="primary" />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Reject assignment">
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => { setRejectAssignmentTarget(a.assignmentId); setRejectAssignmentOpen(true); }}
                />
              </Tooltip>
            </>
          )}
          {a.status === 'ACTIVE' && (
            <Tooltip title="Revoke">
              <Popconfirm title="Revoke this role from the user?" onConfirm={() => revokeAssignment.mutate({ userId: a.userId, assignmentId: a.assignmentId })}>
                <Button size="small" icon={<CloseOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const bookAccessColumns: ColumnsType<BookAccessGrant> = [
    {
      title: 'User',
      dataIndex: 'userFullName',
      width: 200,
      render: (v, g) => <><Text strong>{v}</Text> <Text type="secondary" style={{ fontFamily: 'monospace' }}>({g.username})</Text></>,
    },
    {
      title: 'Scope',
      dataIndex: 'scopeLabel',
      render: (v, g) => <><Tag>{g.scopeType.replace('_', ' ')}</Tag> {v}</>,
    },
    {
      title: 'Access Level',
      dataIndex: 'accessLevel',
      width: 130,
      render: (v: BookAccessLevel) => <Tag color={v === 'READ_WRITE' ? 'volcano' : 'blue'}>{v.replace('_', ' ')}</Tag>,
      filters: ACCESS_LEVEL_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (value, g) => g.accessLevel === value,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 155,
      render: (v: BookAccessGrantStatus) => <Tag color={GRANT_STATUS_COLOR[v]}>{v.replace('_', ' ')}</Tag>,
      filters: (['PENDING_APPROVAL', 'ACTIVE', 'REJECTED', 'EXPIRED'] as BookAccessGrantStatus[]).map((v) => ({ text: v.replace('_', ' '), value: v })),
      onFilter: (value, g) => g.status === value,
    },
    { title: 'Assigned By', dataIndex: 'assignedBy', width: 120, render: (v) => <Text type="secondary">{v}</Text> },
    { title: 'Valid From', dataIndex: 'validFrom', width: 110 },
    {
      title: 'Actions',
      key: 'actions',
      width: 160,
      render: (_, g) => (
        <Space size={4}>
          {g.status === 'PENDING_APPROVAL' && (
            <>
              <Tooltip title="Approve grant">
                <Popconfirm title="Approve this book access grant?" onConfirm={() => approveBookAccessGrant.mutate(g.grantId)}>
                  <Button size="small" icon={<CheckOutlined />} type="primary" />
                </Popconfirm>
              </Tooltip>
              <Tooltip title="Reject grant">
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  danger
                  onClick={() => { setRejectGrantTarget(g.grantId); setRejectGrantOpen(true); }}
                />
              </Tooltip>
            </>
          )}
          {g.status === 'ACTIVE' && (
            <Tooltip title="Revoke">
              <Popconfirm title="Revoke this access grant?" onConfirm={() => revokeBookAccessGrant.mutate({ userId: g.userId, grantId: g.grantId })}>
                <Button size="small" icon={<CloseOutlined />} danger />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  const pendingRoles = roles.filter((r) => r.status === 'PENDING_APPROVAL');
  const pendingAssignments = assignments.filter((a) => a.status === 'PENDING_APPROVAL');
  const pendingBookAccessGrants = bookAccessGrants.filter((g) => g.status === 'PENDING_APPROVAL');

  return (
    <div style={{ maxWidth: 1100 }}>
      <PageHeader
        title="Role Management"
        description="Define custom roles, configure function permissions, and manage user role assignments."
        moduleGroup="admin"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create Role
          </Button>
        }
      />

      {(pendingRoles.length > 0 || pendingAssignments.length > 0 || pendingBookAccessGrants.length > 0) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <>
              {pendingRoles.length > 0 && <span><strong>{pendingRoles.length}</strong> role(s) pending approval. </span>}
              {pendingAssignments.length > 0 && <span><strong>{pendingAssignments.length}</strong> assignment(s) pending approval. </span>}
              {pendingBookAccessGrants.length > 0 && <span><strong>{pendingBookAccessGrants.length}</strong> access grant(s) pending approval.</span>}
            </>
          }
        />
      )}

      <Tabs
        defaultActiveKey="roles"
        items={[
          {
            key: 'roles',
            label: (
              <Badge count={pendingRoles.length} offset={[8, 0]} color="orange">
                Roles
              </Badge>
            ),
            children: (
              <>
                <Input
                  allowClear
                  placeholder="Search by code, name, or description…"
                  prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                  value={roleSearch}
                  onChange={(e) => setRoleSearch(e.target.value)}
                  style={{ maxWidth: 360, marginBottom: 12 }}
                />
                <Table<UserRole>
                  columns={roleColumns}
                  dataSource={filteredRoles}
                  rowKey="roleId"
                  loading={rolesLoading}
                  size="small"
                  pagination={{ pageSize: 15, showSizeChanger: false }}
                />
              </>
            ),
          },
          {
            key: 'assignments',
            label: (
              <Badge count={pendingAssignments.length} offset={[8, 0]} color="orange">
                User Assignments
              </Badge>
            ),
            children: (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <Input
                    allowClear
                    placeholder="Search by user or role…"
                    prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                    value={assignmentSearch}
                    onChange={(e) => setAssignmentSearch(e.target.value)}
                    style={{ maxWidth: 360 }}
                  />
                  <Button type="primary" icon={<UserAddOutlined />} onClick={() => setAssignOpen(true)}>
                    Assign Role
                  </Button>
                </div>
                <Table<UserRoleAssignment>
                  columns={assignmentColumns}
                  dataSource={filteredAssignments}
                  rowKey="assignmentId"
                  loading={assignmentsLoading}
                  size="small"
                  pagination={{ pageSize: 15, showSizeChanger: false }}
                />
              </>
            ),
          },
          {
            key: 'book-access',
            label: (
              <Badge count={pendingBookAccessGrants.length} offset={[8, 0]} color="orange">
                Book Access
              </Badge>
            ),
            children: (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                  <Input
                    allowClear
                    placeholder="Search by user or scope…"
                    prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
                    value={bookAccessSearch}
                    onChange={(e) => setBookAccessSearch(e.target.value)}
                    style={{ maxWidth: 360 }}
                  />
                  <Button type="primary" icon={<UserAddOutlined />} onClick={() => setRequestAccessOpen(true)}>
                    Request Access
                  </Button>
                </div>
                <Table<BookAccessGrant>
                  columns={bookAccessColumns}
                  dataSource={filteredBookAccessGrants}
                  rowKey="grantId"
                  loading={bookAccessGrantsLoading}
                  size="small"
                  pagination={{ pageSize: 15, showSizeChanger: false }}
                />
              </>
            ),
          },
        ]}
      />

      <RoleFormModal
        open={formOpen}
        editing={editingRole}
        modules={modules}
        functions={functions}
        onClose={() => setFormOpen(false)}
      />

      <AssignRoleModal open={assignOpen} onClose={() => setAssignOpen(false)} />

      <RequestAccessModal open={requestAccessOpen} onClose={() => setRequestAccessOpen(false)} />

      <RejectModal
        open={rejectOpen}
        loading={rejectRole.isPending}
        onCancel={() => setRejectOpen(false)}
        onOk={(reason) => {
          if (rejectTarget !== null) {
            rejectRole.mutate({ id: rejectTarget, reason }, {
              onSuccess: () => { setRejectOpen(false); setRejectTarget(null); },
            });
          }
        }}
      />

      <RejectModal
        open={rejectAssignmentOpen}
        loading={rejectAssignment.isPending}
        onCancel={() => setRejectAssignmentOpen(false)}
        onOk={(reason) => {
          if (rejectAssignmentTarget !== null) {
            rejectAssignment.mutate({ assignmentId: rejectAssignmentTarget, reason }, {
              onSuccess: () => { setRejectAssignmentOpen(false); setRejectAssignmentTarget(null); },
            });
          }
        }}
      />

      <RejectModal
        open={rejectGrantOpen}
        loading={rejectBookAccessGrant.isPending}
        onCancel={() => setRejectGrantOpen(false)}
        onOk={(reason) => {
          if (rejectGrantTarget !== null) {
            rejectBookAccessGrant.mutate({ grantId: rejectGrantTarget, reason }, {
              onSuccess: () => { setRejectGrantOpen(false); setRejectGrantTarget(null); },
            });
          }
        }}
      />
    </div>
  );
}
