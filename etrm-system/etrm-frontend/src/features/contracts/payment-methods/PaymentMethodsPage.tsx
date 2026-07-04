import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { usePaymentMethods, useSavePaymentMethod, useDeactivatePaymentMethod } from './hooks';
import { PAYMENT_METHOD_TYPES, type PaymentMethod, type PaymentMethodInput, type PaymentMethodType } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const TYPE_COLOR: Record<PaymentMethodType, string> = {
  SWIFT: 'blue',
  SEPA: 'green',
  ACH: 'cyan',
  NETTING: 'purple',
  LETTER_OF_CREDIT: 'orange',
  BANK_GUARANTEE: 'red',
  WIRE: 'default',
};

export function PaymentMethodsPage() {
  const { data, isLoading, refetch } = usePaymentMethods();
  const save = useSavePaymentMethod();
  const deactivate = useDeactivatePaymentMethod();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PaymentMethod | null>(null);
  const [form] = Form.useForm<PaymentMethodInput>();
  useFormDraft('contracts-payment-methods', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('isActive', true);
    setOpen(true);
  }

  function openEdit(pm: PaymentMethod) {
    setEditing(pm);
    form.setFieldsValue({
      methodCode: pm.methodCode,
      methodName: pm.methodName,
      methodType: pm.methodType,
      currencyRestriction: pm.currencyRestriction ?? undefined,
      processingDays: pm.processingDays,
      description: pm.description ?? undefined,
      isActive: pm.isActive,
    });
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.paymentMethodId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<PaymentMethod>[]>(() => [
    { field: 'methodCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
    { field: 'methodName', headerName: 'Name', flex: 1.2 },
    {
      field: 'methodType', headerName: 'Type', width: 170,
      cellRenderer: (p: { value: PaymentMethodType }) => (
        <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag>
      ),
    },
    {
      field: 'currencyRestriction', headerName: 'Currency', width: 110,
      valueFormatter: (p) => p.value ?? 'Any',
    },
    {
      field: 'processingDays', headerName: 'Processing Days', width: 150,
      type: 'numericColumn', cellClass: 'cell-mono',
    },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PaymentMethod }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate payment method?" onConfirm={() => deactivate.mutate(p.data.paymentMethodId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Payment Methods"
        description="Settlement methods — SWIFT, SEPA, netting, letters of credit. Processing days affect payment timing calculations."
        moduleGroup="contracts"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Payment Method"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.paymentMethodId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Payment Method — ${editing.methodCode}` : 'New Payment Method'}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
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
            name="methodCode"
            label={hint('Method Code', 'Short unique identifier for this payment method — used in contract and settlement references.', 'SWIFT-USD')}
            rules={[{ required: true }]}
          >
            <Input placeholder="SWIFT-USD" style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Form.Item
            name="methodName"
            label="Method Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="SWIFT International Wire" />
          </Form.Item>

          <Form.Item
            name="methodType"
            label={hint(
              'Method Type',
              'SWIFT = international wire, 1-3 days. SEPA = EUR eurozone, same-day. ACH = US domestic, 1 day. NETTING = offset of payables vs receivables — reduces settlement risk.',
            )}
            rules={[{ required: true }]}
          >
            <Select options={PAYMENT_METHOD_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>

          <Form.Item
            name="currencyRestriction"
            label="Currency Restriction"
          >
            <Input placeholder="e.g. USD — leave blank for any currency" style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Form.Item
            name="processingDays"
            label={hint(
              'Processing Days',
              'Business days from instruction to settlement. Critical for margin call timing and LC presentation.',
              '1',
            )}
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} placeholder="1" min={0} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Optional description" />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
