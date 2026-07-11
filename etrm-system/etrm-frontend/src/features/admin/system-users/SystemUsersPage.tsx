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
      field: 'roles', headerName: 'Roles', flex: 1, minWidth: 220,
      tooltipValueGetter: (p) => p.data?.roles.length
        ? p.data.roles.map((r) => `${r.roleName}${r.status === 'PENDING_APPROVAL' ? ' (Pending)' : ''}`).join(', ')
        : 'No role',
      cellRenderer: (p: { data: SystemUser }) => p.data.roles.length ? (
        <Space size={4} wrap>
          {p.data.roles.map((r) => (
            <Tag key={r.assignmentId} color={r.status === 'PENDING_APPROVAL' ? 'orange' : undefined}>
              {r.roleName}{r.status === 'PENDING_APPROVAL' ? ' (Pending)' : ''}
            </Tag>
          ))}
        </Space>
      ) : <Tag color="default">No role</Tag>,
    },
    { field: 'department', headerName: 'Department', flex: 0.8, valueFormatter: (p) => p.value ?? '—' },
    { field: 'officeLocation', headerName: 'Location', flex: 1, minWidth: 120, valueFormatter: (p) => p.value ?? '—', tooltipValueGetter: (p) => p.value },
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
          {editing ? (
            <Form.Item
              label={hint(
                'Roles',
                'A user can hold more than one role at once. To grant an additional role, approve a request, or revoke one, use Roles & Permissions → User Assignments — that keeps the request/approval history intact instead of silently overwriting access here.',
              )}
            >
              <Space size={4} wrap>
                {editing.roles.length
                  ? editing.roles.map((r) => (
                    <Tag key={r.assignmentId} color={r.status === 'PENDING_APPROVAL' ? 'orange' : undefined}>
                      {r.roleName}{r.status === 'PENDING_APPROVAL' ? ' (Pending)' : ''}
                    </Tag>
                  ))
                  : <Tag color="default">No role</Tag>}
              </Space>
            </Form.Item>
          ) : (
            <Form.Item
              name="roleId"
              label={hint(
                'Role',
                'Requests this role for the new user — goes to Roles & Permissions → User Assignments for approval before it takes effect, same as any other role assignment. Additional roles can be granted later from that same page.',
              )}
              rules={[{ required: true, message: 'Role is required' }]}
            >
              <Select
                options={assignableRoles.map((r) => ({ label: r.roleName, value: r.roleId }))}
                placeholder="Select role"
              />
            </Form.Item>
          )}
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
