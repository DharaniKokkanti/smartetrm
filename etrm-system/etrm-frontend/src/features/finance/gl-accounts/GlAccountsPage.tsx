import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Tooltip } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTableRows } from '@features/tier2/hooks';
import { COMMODITY_TYPES } from '@features/organization/desks/types';
import { useGlAccounts, useSaveGlAccount, useDeactivateGlAccount } from './hooks';
import type { GlAccount, GlAccountInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const ACCOUNT_TYPE_COLOR: Record<string, string> = {
  REVENUE: 'green', COST: 'red', ASSET: 'blue', LIABILITY: 'orange', EQUITY: 'purple', PNL: 'geekblue',
};

export function GlAccountsPage() {
  const { data = [], isLoading, refetch } = useGlAccounts();
  const save       = useSaveGlAccount();
  const deactivate = useDeactivateGlAccount();
  const { data: accountTypeRows = [] } = useTableRows('gl_account_type');
  type LR = { typeCode: string; typeName: string };
  const accountTypeOpts = (accountTypeRows as LR[]).map((r) => ({ value: r.typeCode, label: r.typeName }));

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<GlAccount | null>(null);
  const [form]                = Form.useForm<GlAccountInput>();
  useFormDraft('finance-gl', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ accountType: 'REVENUE', isActive: true });
    setOpen(true);
  }
  function openEdit(r: GlAccount) {
    setEditing(r);
    form.setFieldsValue({ ...r, commodityType: r.commodityType ?? undefined, costCenter: r.costCenter ?? undefined, description: r.description ?? undefined });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.accountId ?? null, input: { ...v, commodityType: v.commodityType ?? null, costCenter: v.costCenter ?? null, description: v.description ?? null } });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<GlAccount>[]>(() => [
    { field: 'accountCode', headerName: 'Account Code', width: 130, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'accountName', headerName: 'Account Name', flex: 1.5, minWidth: 220 },
    { field: 'accountType', headerName: 'Type', width: 120,
      cellRenderer: (p: { value: string }) => <Tag color={ACCOUNT_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'commodityType', headerName: 'Commodity', width: 110, valueFormatter: (p) => p.value ?? 'All' },
    { field: 'costCenter',    headerName: 'Cost Centre', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'description',   headerName: 'Description', flex: 1, minWidth: 200, cellStyle: { fontSize: 11, color: '#6b7280' }, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 80, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: GlAccount }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.isActive && (
            <Popconfirm title="Deactivate this account?" onConfirm={() => deactivate.mutate(p.data.accountId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ) },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="GL Accounts" description="Chart of accounts for trade P&L, fee, and settlement postings. Each account has a type (Revenue, Cost, Asset, Liability, Equity, P&L), optional commodity scope, and cost centre." moduleGroup="finance" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New GL Account" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.accountId)} />
      <Drawer title={editing ? `Edit — ${editing.accountCode} ${editing.accountName}` : 'New GL Account'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="accountCode" label={hint('Account Code', 'Numeric or alphanumeric GL code — e.g. 4100, 5200.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="4100" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="accountType" label="Account Type" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={accountTypeOpts} />
            </Form.Item>
          </Space>
          <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
            <Input placeholder="Trade Revenue — Physical" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="commodityType" label={hint('Commodity Scope', 'Leave blank if this account applies to all commodities.')} style={{ flex: 1 }}>
              <Select allowClear placeholder="All commodities" options={COMMODITY_TYPES.map((c) => ({ value: c, label: c }))} />
            </Form.Item>
            <Form.Item name="costCenter" label={hint('Cost Centre', 'Internal cost centre code — TRADING, OPERATIONS, RISK.')} style={{ flex: 1 }}>
              <Input placeholder="TRADING" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Brief description of what posts to this account." />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
