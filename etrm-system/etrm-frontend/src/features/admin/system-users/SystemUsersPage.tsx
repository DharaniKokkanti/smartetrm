import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useSystemUsers, useSaveSystemUser, useDeactivateSystemUser } from './hooks';
import { USER_ROLES, type SystemUser, type SystemUserInput, type UserRole } from './types';

const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN: 'red',
  TRADER: 'blue',
  RISK_MANAGER: 'orange',
  OPERATIONS: 'cyan',
  COMPLIANCE: 'purple',
  VIEWER: 'default',
};

export function SystemUsersPage() {
  const { data, isLoading, refetch } = useSystemUsers();
  const save = useSaveSystemUser();
  const deactivate = useDeactivateSystemUser();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [form] = Form.useForm<SystemUserInput>();

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
      role: u.role,
      traderId: u.traderId ?? undefined,
      department: u.department ?? undefined,
      phone: u.phone ?? undefined,
      preferredLocale: u.preferredLocale ?? undefined,
      officeLocation: u.officeLocation ?? undefined,
      isActive: u.isActive,
    });
    setOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    await save.mutateAsync({ id: editing?.userId ?? null, input: values });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<SystemUser>[]>(() => [
    { field: 'username', headerName: 'Username', cellClass: 'cell-mono', width: 140, pinned: 'left' },
    { field: 'fullName', headerName: 'Full Name', flex: 1 },
    { field: 'email', headerName: 'Email', flex: 1.2 },
    {
      field: 'role', headerName: 'Role', width: 140,
      cellRenderer: (p: { value: UserRole }) => (
        <Tag color={ROLE_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag>
      ),
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

      <Drawer
        title={editing ? `Edit User — ${editing.username}` : 'New User'}
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
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
            name="role"
            label={hint('Role', 'ADMIN = full system access. TRADER = deal capture + own book view. RISK_MANAGER = read all positions. COMPLIANCE = trade surveillance. VIEWER = read-only.')}
            rules={[{ required: true, message: 'Role is required' }]}
          >
            <Select
              options={USER_ROLES.map((r) => ({ label: r.replace(/_/g, ' '), value: r }))}
              placeholder="Select role"
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
