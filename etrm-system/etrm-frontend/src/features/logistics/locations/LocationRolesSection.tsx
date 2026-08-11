import { useState } from 'react';
import { Button, Table, Modal, Form, Select, Input, DatePicker, Space, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { hint } from '@components/smart/FieldHint';
import { useLocationRoles, useSaveLocationRole, useDeleteLocationRole } from './hooks';
import { LOCATION_TYPE_CODES, type LocationRoleAssignment, type LocationRoleAssignmentInput, type LocationTypeCode } from './types';

interface RoleFormValues {
  locationTypeCode: LocationTypeCode;
  approvalReference?: string;
  effectiveDate?: Dayjs;
  expiryDate?: Dayjs;
  notes?: string;
}

/** Extra roles a location holds beyond its primary locationTypeCode — e.g. a
 *  WAREHOUSE that's also an exchange-approved delivery point. Only rendered
 *  for an already-saved location (roles are a sub-resource keyed by
 *  locationId). Each add/remove hits the API immediately, same live-CRUD
 *  pattern as Clearing Account's Bank Accounts/Addresses tabs. */
export function LocationRolesSection({ locationId, primaryTypeCode }: { locationId: number; primaryTypeCode: LocationTypeCode }) {
  const { data = [], isLoading } = useLocationRoles(locationId);
  const save = useSaveLocationRole(locationId);
  const remove = useDeleteLocationRole(locationId);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<RoleFormValues>();

  const takenTypes = new Set([primaryTypeCode, ...data.map((r) => r.locationTypeCode)]);
  const availableTypes = LOCATION_TYPE_CODES.filter((t) => !takenTypes.has(t));

  function openAdd() {
    form.resetFields();
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    const input: LocationRoleAssignmentInput = {
      locationTypeCode: v.locationTypeCode,
      approvalReference: v.approvalReference ?? null,
      effectiveDate: v.effectiveDate ? v.effectiveDate.format('YYYY-MM-DD') : null,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : null,
      notes: v.notes ?? null,
      rowVersion: 0,
    };
    await save.mutateAsync(input);
    setOpen(false);
  }

  const columns: ColumnsType<LocationRoleAssignment> = [
    { title: 'Role', dataIndex: 'locationTypeCode', width: 130, render: (v: LocationTypeCode) => v.replace(/_/g, ' ') },
    { title: 'Approval Ref', dataIndex: 'approvalReference', render: (v) => v || '—' },
    { title: 'Effective', dataIndex: 'effectiveDate', width: 110, render: (v) => v || '—' },
    { title: 'Expiry', dataIndex: 'expiryDate', width: 110, render: (v) => v || '—' },
    {
      title: '', key: 'actions', width: 50,
      render: (_, r) => (
        <Popconfirm title="Remove this role?" onConfirm={() => remove.mutate(r.locationRoleAssignmentId)}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ marginTop: 16 }}>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 8 }}>
        <Typography.Text strong>{hint('Additional Roles', 'Extra roles this location holds beyond its primary type above — e.g. a WAREHOUSE that is also an exchange-approved delivery point. The primary type doesn’t change; this only adds to it.')}</Typography.Text>
        <Button size="small" icon={<PlusOutlined />} onClick={openAdd} disabled={availableTypes.length === 0}>Add Role</Button>
      </Space>
      <Table<LocationRoleAssignment>
        size="small" rowKey="locationRoleAssignmentId" pagination={false}
        loading={isLoading} columns={columns} dataSource={data}
        locale={{ emptyText: 'No additional roles.' }}
      />
      <Modal title="Add Role" open={open} onCancel={() => setOpen(false)} onOk={() => { void submit(); }} confirmLoading={save.isPending} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="locationTypeCode" label="Role Type" rules={[{ required: true }]}>
            <Select options={availableTypes.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>
          <Form.Item name="approvalReference" label={hint('Approval Reference', 'Exchange registration/approval number, if this role is an exchange-delivery-point approval.', 'LME-WH-00412')}>
            <Input placeholder="LME-WH-00412" />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="effectiveDate" label="Effective Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} defaultPickerValue={dayjs()} />
            </Form.Item>
            <Form.Item name="expiryDate" label="Expiry Date" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} defaultPickerValue={dayjs()} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
