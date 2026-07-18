import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Tooltip } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTableRows } from '@features/tier2/hooks';
import { COMMODITY_TYPE_LOOKUP, commodityLabel } from '@features/reference/commodity-types/types';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useBooks } from '@features/organization/books/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useGlAccounts, useSaveGlAccount, useDeactivateGlAccount } from './hooks';
import type { GlAccount, GlAccountInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';

const NORMAL_BALANCE_OPTS = [
  { value: 'DEBIT', label: 'Debit' },
  { value: 'CREDIT', label: 'Credit' },
];

const ACCOUNT_TYPE_COLOR: Record<string, string> = {
  REVENUE: 'green', COST: 'red', ASSET: 'blue', LIABILITY: 'orange', EQUITY: 'purple', PNL: 'geekblue',
};

export function GlAccountsPage() {
  const { data = [], isLoading, refetch } = useGlAccounts();
  const save       = useSaveGlAccount();
  const deactivate = useDeactivateGlAccount();
  const { data: accountTypeRows = [] } = useTableRows<{ typeCode: string; typeName: string }>('gl_account_type');
  const accountTypeOpts = accountTypeRows.map((r) => ({ value: r.typeCode, label: r.typeName }));

  const { data: legalEntities = [] } = useLegalEntities();
  const legalEntityOpts = legalEntities.map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` }));
  const { data: books = [] } = useBooks();
  const bookOpts = books.map((b) => ({ value: b.bookId, label: `${b.bookCode} — ${b.bookName}` }));
  const { data: currencies = [] } = useCurrencies();
  const currencyOpts = currencies.map((c) => ({ value: c.currencyId, label: `${c.currencyCode} — ${c.currencyName}` }));
  const currencyLabelById = new Map(currencies.map((c) => [c.currencyId, `${c.currencyCode} — ${c.currencyName}`]));

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<GlAccount | null>(null);
  const [form]                = Form.useForm<GlAccountInput>();
  useFormDraft('finance-gl', { form, open, setOpen, editing, setEditing });

  const parentAccountOpts = data
    .filter((a) => a.accountId !== editing?.accountId)
    .map((a) => ({ value: a.accountId, label: `${a.accountCode} — ${a.accountName}` }));

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ accountType: 'REVENUE', isActive: true, normalBalance: 'DEBIT', isControlAccount: false });
    setOpen(true);
  }
  function openEdit(r: GlAccount) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      commodityType: r.commodityType ?? undefined,
      costCenter: r.costCenter ?? undefined,
      description: r.description ?? undefined,
      legalEntityId: r.legalEntityId ?? undefined,
      bookId: r.bookId ?? undefined,
      parentAccountId: r.parentAccountId ?? undefined,
      currencyId: r.currencyId ?? undefined,
      externalGlCode: r.externalGlCode ?? undefined,
    });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({
      id: editing?.accountId ?? null,
      input: {
        ...v,
        commodityType: v.commodityType ?? null,
        costCenter: v.costCenter ?? null,
        description: v.description ?? null,
        legalEntityId: v.legalEntityId ?? null,
        bookId: v.bookId ?? null,
        parentAccountId: v.parentAccountId ?? null,
        currencyId: v.currencyId ?? null,
        externalGlCode: v.externalGlCode ?? null,
      },
    });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<GlAccount>[]>(() => [
    { field: 'accountCode', headerName: 'Account Code', width: 130, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'accountName', headerName: 'Account Name', flex: 1.5, minWidth: 220 },
    { field: 'accountType', headerName: 'Type', width: 120,
      cellRenderer: (p: { value: string }) => <Tag color={ACCOUNT_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'normalBalance', headerName: 'Balance', width: 90,
      cellRenderer: (p: { value: string }) => <Tag color={p.value === 'DEBIT' ? 'blue' : 'gold'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'legalEntityCode', headerName: 'Booking Company', width: 140, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? 'All entities' },
    { field: 'bookCode', headerName: 'Book', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'parentAccountCode', headerName: 'Parent Account', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'commodityType', headerName: 'Commodity', width: 110, valueFormatter: (p) => p.value != null ? commodityLabel(p.value) : 'All' },
    { field: 'currencyId', headerName: 'Currency', width: 130, valueFormatter: (p) => (p.value != null ? currencyLabelById.get(p.value) ?? String(p.value) : '—') },
    { field: 'costCenter',    headerName: 'Cost Centre', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'externalGlCode', headerName: 'External GL Code', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'isControlAccount', headerName: 'Control', width: 85,
      cellRenderer: (p: { value: boolean }) => (p.value ? <Tag color="purple" style={{ fontSize: 10 }}>Control</Tag> : null) },
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
  ], [deactivate, currencyLabelById]);

  return (
    <>
      <PageHeader title="GL Accounts" description="Chart of accounts for trade P&L, fee, and settlement postings. Each account has a type (Revenue, Cost, Asset, Liability, Equity, P&L), a normal balance, an optional booking company and book scope for P&L attribution, hierarchy via parent account, currency, and cost centre." moduleGroup="finance" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New GL Account" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.accountId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit — ${editing.accountCode} ${editing.accountName}` : 'New GL Account'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="accountCode" label={hint('Account Code', 'Numeric or alphanumeric GL code — e.g. 4100, 5200.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="4100" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="accountType" label={hint('Account Type', 'Drives normal balance (Debit/Credit) and which financial statement this account rolls up into — Revenue/Cost hit the P&L, Asset/Liability/Equity hit the balance sheet.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={accountTypeOpts} />
            </Form.Item>
          </Space>
          <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
            <Input placeholder="Trade Revenue — Physical" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="normalBalance" label={hint('Normal Balance', 'Which side of the ledger increases this account — Debit for assets/expenses, Credit for liabilities/equity/revenue.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={NORMAL_BALANCE_OPTS} />
            </Form.Item>
            <Form.Item name="isControlAccount" label={hint('Control Account', 'Summary/rollup account — should not receive direct postings.')} valuePropName="checked" style={{ flex: 1 }}>
              <Switch />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="legalEntityId" label={hint('Booking Company', 'Legal entity this account belongs to. Leave blank for a shared/corporate account used across all entities.')} style={{ flex: 1 }}>
              <Select allowClear placeholder="All entities (shared)" options={legalEntityOpts} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="bookId" label={hint('Book (Portfolio)', 'Trading book this account is scoped to for P&L attribution. Leave blank if not book-specific.')} style={{ flex: 1 }}>
              <Select allowClear placeholder="Not book-specific" options={bookOpts} showSearch optionFilterProp="label" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="parentAccountId" label={hint('Parent Account', 'For chart-of-accounts hierarchy and rollups. Leave blank for a top-level account.')} style={{ flex: 1 }}>
              <Select allowClear placeholder="Top level" options={parentAccountOpts} showSearch optionFilterProp="label" />
            </Form.Item>
            <Form.Item name="currencyId" label={hint('Currency', 'Leave blank to follow the booking entity\'s base currency.')} style={{ flex: 1 }}>
              <Select allowClear placeholder="Entity base currency" options={currencyOpts} showSearch optionFilterProp="label" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="commodityType" label={hint('Commodity Scope', 'Leave blank if this account applies to all commodities.')} style={{ flex: 1 }}>
              <Select allowClear placeholder="All commodities" options={COMMODITY_TYPE_LOOKUP.map((l) => ({ value: l.lookupId, label: l.label }))} />
            </Form.Item>
            <Form.Item name="costCenter" label={hint('Cost Centre', 'Internal cost centre code — TRADING, OPERATIONS, RISK.')} style={{ flex: 1 }}>
              <Input placeholder="TRADING" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Form.Item name="externalGlCode" label={hint('External GL Code', 'Mapping code to the external ERP / GL system of record (SAP, Oracle, etc).')}>
            <Input placeholder="SAP-410010" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Brief description of what posts to this account." />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
