import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useSystemUsers, useSaveSystemUser, useDeactivateSystemUser } from './hooks';
import type { SystemUser, SystemUserInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { useRoles } from '@features/admin/roles/hooks';

export function SystemUsersPage() {
  const { data, isLoading, refetch } = useSystemUsers();
  const { data: allRoles = [] } = useRoles();
  // Only APPROVED roles can actually be requested for a user — same
  // constraint the role-assignment endpoint itself enforces.
  const assignableRoles = useMemo(() => allRoles.filter((r) => r.status === 'APPROVED'), [allRoles]);
  const save = useSaveSystemUser();
  const deactivate = useDeactivateSystemUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form] = Form.useForm<SystemUserInput>();
  useFormDraft('admin-users', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('isActive', true);
    setOpen(true);
  }

  function openEdit(u: SystemUser) {
    setEditing(u);
    form.setFieldsValue({
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      roleId: u.roleId ?? undefined,
      traderId: u.traderId ?? undefined,
      department: u.department ?? undefined,
      phone: u.phone ?? undefined,
      preferredLocale: u.preferredLocale ?? undefined,
      officeLocation: u.officeLocation ?? undefined,
      isActive: u.isActive,
    });
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.userId ?? null, input: values });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<SystemUser>[]>(() => [
    { field: 'username', headerName: 'Username', cellClass: 'cell-mono', width: 140, pinned: 'left' },
    { field: 'fullName', headerName: 'Full Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.2 },
    {
      field: 'roleCode', headerName: 'Role', width: 170,
      cellRenderer: (p: { data: SystemUser }) => p.data.roleCode ? (
        <Space size={4}>
          <Tag>{p.data.roleName ?? p.data.roleCode}</Tag>
          {p.data.assignmentStatus === 'PENDING_APPROVAL' && <Tag color="orange">Pending</Tag>}
        </Space>
      ) : <Tag color="default">No role</Tag>,
    },
    { field: 'department', headerName: 'Department', flex: 0.8, valueFormatter: (p) => p.value ?? '—' },
    { field: 'officeLocation', headerName: 'Location', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'preferredLocale', headerName: 'Locale', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'lastLogin', headerName: 'Last Login', width: 160,
      valueFormatter: (p) => p.value ? new Date(p.value).toLocaleString() : '—',
    },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: SystemUser }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate user?" onConfirm={() => deactivate.mutate(p.data.userId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader
        title="System Users"
        description="User accounts and role assignments. Controls access permissions across all ETRM modules."
        moduleGroup="admin"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New User"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.userId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit User — ${editing.username}` : 'New User'}
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="username"
            label={hint('Username', 'System login name — alphanumeric, no spaces. Used for audit trails and API authentication.', 'j.doe')}
            rules={[{ required: true, message: 'Username is required' }]}
          >
            <Input placeholder="j.doe" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Email is required' }, { type: 'email', message: 'Enter a valid email address' }]}
          >
            <Input placeholder="user@company.com" />
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[{ required: true, message: 'Full name is required' }]}
          >
            <Input placeholder="Jane Doe" />
          </Form.Item>
          <Form.Item
            name="roleId"
            label={hint(
              'Role',
              editing
                ? 'Set once, on creation. To change an existing user’s role, use Roles & Permissions → User Assignments — that keeps the request/approval history intact instead of silently overwriting access.'
                : 'Requests this role for the new user — goes to Roles & Permissions → User Assignments for approval before it takes effect, same as any other role assignment.',
            )}
            rules={[{ required: !editing, message: 'Role is required' }]}
            extra={editing?.assignmentStatus === 'PENDING_APPROVAL' ? 'Awaiting approval on Roles & Permissions → User Assignments.' : undefined}
          >
            <Select
              options={assignableRoles.map((r) => ({ label: r.roleName, value: r.roleId }))}
              placeholder="Select role"
              disabled={!!editing}
            />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input placeholder="Trading" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+1 212 555 0100" />
          </Form.Item>
          <Form.Item
            name="preferredLocale"
            label={hint('Preferred Locale', 'BCP 47 locale tag — drives date and number formatting. e.g. en-GB, en-US, fr-FR, de-DE', 'en-GB')}
            rules={[{ pattern: /^[a-z]{2}(-[A-Z]{2})?$/, message: 'Use BCP 47 format: en-GB, fr-FR, etc.' }]}
          >
            <Input placeholder="en-GB" style={{ fontFamily: 'monospace', width: 140 }} />
          </Form.Item>
          <Form.Item
            name="officeLocation"
            label={hint('Office Location', 'City or office where this user is based. Used to set default timezone context.', 'London')}
          >
            <Input placeholder="London" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
