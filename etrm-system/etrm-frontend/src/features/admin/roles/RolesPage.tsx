import { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Badge, Space, Modal, Form, Input, Checkbox, Tooltip,
  Typography, Divider, Popconfirm, Tabs, Alert, Spin, Row, Col,
} from 'antd';
import {
  PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined,
  SendOutlined, LockOutlined, UnlockOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { AppFunction, AppModule, RoleFunction, RoleStatus, UserRole, UserRoleAssignment } from './types';
import {
  useRoles, useRoleDetail, useModules, useFunctions,
  useCreateRole, useUpdateRole, useSubmitRole, useApproveRole, useRejectRole,
  useAssignments, useAssignRole, useApproveAssignment, useRejectAssignment, useRevokeAssignment,
} from './hooks';

const { Title, Text } = Typography;

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
    <Modal
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
  const { data: detail } = useRoleDetail(editing?.roleId ?? null);
  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const saving = createRole.isPending || updateRole.isPending;

  const [grantMap, setGrantMap] = useState<Map<number, 'READ' | 'READ_WRITE'>>(new Map());

  // Seed grantMap when role detail loads
  useEffect(() => {
    if (detail?.functions) {
      const m = new Map<number, 'READ' | 'READ_WRITE'>();
      detail.functions.forEach((rf: RoleFunction) => m.set(rf.functionId, rf.accessLevel));
      setGrantMap(m);
    }
  }, [detail]);

  // Reset when switching between roles (or create vs edit)
  useEffect(() => {
    if (!editing) {
      form.resetFields();
      setGrantMap(new Map());
    } else {
      form.setFieldsValue({ roleCode: editing.roleCode, roleName: editing.roleName, description: editing.description });
    }
  }, [editing, form]);

  async function handleOk() {
    const vals = await form.validateFields();
    const fnList = [...grantMap.entries()].map(([functionId, accessLevel]) => ({ functionId, accessLevel }));
    const input = { roleCode: vals.roleCode, roleName: vals.roleName, description: vals.description ?? null, functions: fnList };
    if (editing) {
      await updateRole.mutateAsync({ id: editing.roleId, input });
    } else {
      await createRole.mutateAsync(input);
    }
    form.resetFields();
    setGrantMap(new Map());
    onClose();
  }

  const isSystem = editing?.roleType === 'SYSTEM';

  return (
    <Modal
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
            <Form.Item name="roleCode" label="Role Code" rules={[{ required: true }, { max: 50 }]}>
              <Input placeholder="e.g. CRUDE_TRADER" disabled={!!editing || isSystem} style={{ textTransform: 'uppercase' }} />
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

// ── Main page ─────────────────────────────────────────────────────────────────
export function RolesPage() {
  const { data: roles = [], isLoading: rolesLoading } = useRoles();
  const { data: modules = [] } = useModules();
  const { data: functions = [] } = useFunctions();
  const { data: assignments = [] } = useAssignments();

  const submitRole = useSubmitRole();
  const approveRole = useApproveRole();
  const rejectRole = useRejectRole();
  const approveAssignment = useApproveAssignment();
  const rejectAssignment = useRejectAssignment();
  const revokeAssignment = useRevokeAssignment();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<UserRole | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<number | null>(null);
  const [rejectAssignmentOpen, setRejectAssignmentOpen] = useState(false);
  const [rejectAssignmentTarget, setRejectAssignmentTarget] = useState<number | null>(null);

  function openCreate() { setEditingRole(null); setFormOpen(true); }
  function openEdit(r: UserRole) { setEditingRole(r); setFormOpen(true); }

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
    },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 155,
      render: (v: RoleStatus) => <RoleStatusTag status={v} />,
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
    { title: 'User ID', dataIndex: 'userId', width: 80 },
    { title: 'Role', dataIndex: 'roleName', render: (v, r) => <><Text strong>{v}</Text> <Tag style={{ marginLeft: 4 }}>{r.roleCode}</Tag></> },
    {
      title: 'Status',
      dataIndex: 'status',
      width: 155,
      render: (v) => {
        const color = v === 'ACTIVE' ? 'green' : v === 'PENDING_APPROVAL' ? 'orange' : v === 'REJECTED' ? 'red' : 'default';
        return <Tag color={color}>{v.replace('_', ' ')}</Tag>;
      },
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

  const pendingRoles = roles.filter((r) => r.status === 'PENDING_APPROVAL');
  const pendingAssignments = assignments.filter((a) => a.status === 'PENDING_APPROVAL');

  return (
    <div style={{ maxWidth: 1100 }}>
      <Row align="middle" style={{ marginBottom: 20 }}>
        <Col flex={1}>
          <Title level={4} style={{ margin: 0 }}>Role Management</Title>
          <Text type="secondary">Define custom roles, configure function permissions, and manage user role assignments.</Text>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Create Role
          </Button>
        </Col>
      </Row>

      {(pendingRoles.length > 0 || pendingAssignments.length > 0) && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <>
              {pendingRoles.length > 0 && <span><strong>{pendingRoles.length}</strong> role(s) pending approval. </span>}
              {pendingAssignments.length > 0 && <span><strong>{pendingAssignments.length}</strong> assignment(s) pending approval.</span>}
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
              <Table<UserRole>
                columns={roleColumns}
                dataSource={roles}
                rowKey="roleId"
                loading={rolesLoading}
                size="small"
                pagination={{ pageSize: 15, showSizeChanger: false }}
              />
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
              <Table<UserRoleAssignment>
                columns={assignmentColumns}
                dataSource={assignments}
                rowKey="assignmentId"
                size="small"
                pagination={{ pageSize: 15, showSizeChanger: false }}
              />
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
    </div>
  );
}
