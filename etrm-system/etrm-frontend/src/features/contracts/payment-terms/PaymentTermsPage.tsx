import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Drawer, Form, Input, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined, StarFilled } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { usePaymentTerms, useSavePaymentTerm, useDeactivatePaymentTerm } from './hooks';
import type { PaymentTerm, PaymentTermInput } from './types';

export function PaymentTermsPage() {
  const { data, isLoading, refetch } = usePaymentTerms();
  const save = useSavePaymentTerm();
  const deactivate = useDeactivatePaymentTerm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [form] = Form.useForm<PaymentTermInput>();

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, isDefault: false });
    setOpen(true);
  }

  function openEdit(t: PaymentTerm) {
    setEditing(t);
    form.setFieldsValue({
      termCode: t.termCode,
      termName: t.termName,
      netDays: t.netDays,
      discountDays: t.discountDays ?? undefined,
      discountPct: t.discountPct ?? undefined,
      description: t.description ?? undefined,
      isDefault: t.isDefault,
      isActive: t.isActive,
    });
    setOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    await save.mutateAsync({ id: editing?.paymentTermId ?? null, input: values });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<PaymentTerm>[]>(() => [
    { field: 'termCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
    { field: 'termName', headerName: 'Term Name', flex: 1.2 },
    { field: 'netDays', headerName: 'Net Days', width: 100, type: 'numericColumn', cellClass: 'cell-mono' },
    {
      field: 'discountDays', headerName: 'Disc. Days', width: 110,
      valueFormatter: (p) => p.value != null ? String(p.value) : '—',
    },
    {
      field: 'discountPct', headerName: 'Disc. %', width: 100,
      valueFormatter: (p) => p.value != null ? `${p.value}%` : '—',
    },
    {
      field: 'isDefault', headerName: 'Default', width: 90,
      cellRenderer: (p: { value: boolean }) => p.value ? <StarFilled style={{ color: '#faad14' }} /> : null,
    },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PaymentTerm }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate payment term?" onConfirm={() => deactivate.mutate(p.data.paymentTermId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Payment Terms"
        description="Invoice payment terms — net days, early payment discounts. Applied to trade contracts and invoices."
        moduleGroup="contracts"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Payment Term"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.paymentTermId)}
      />

      <Drawer
        title={editing ? `Edit Payment Term — ${editing.termCode}` : 'New Payment Term'}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="termCode"
            label={hint('Term Code', 'Short code used across contracts — NET30, 2/10-NET30, PREPAY.', 'NET30')}
            rules={[{ required: true, message: 'Term code is required' }]}
          >
            <Input placeholder="NET30" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item
            name="termName"
            label="Term Name"
            rules={[{ required: true, message: 'Term name is required' }]}
          >
            <Input placeholder="Net 30 Days" />
          </Form.Item>
          <Form.Item
            name="netDays"
            label={hint('Net Days', 'Calendar days from invoice date to payment due. Industry standard: crude oil = 30 days, LNG = 45 days, metals = 2 days (LME prompt).', '30')}
            rules={[{ required: true, message: 'Net days is required' }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="30" min={0} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item
              name="discountDays"
              label={hint('Discount Days', 'Early payment discount. e.g. 2/10 net 30 = 2% discount if paid within 10 days.', '10')}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="10" min={0} />
            </Form.Item>
            <Form.Item
              name="discountPct"
              label={hint('Discount %', 'Early payment discount rate. e.g. 2/10 net 30 = 2% discount if paid within 10 days.', '2.0')}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="2.0" min={0} max={100} step={0.1} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional notes about this payment term" />
          </Form.Item>
          <Form.Item name="isDefault" label="Default" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
