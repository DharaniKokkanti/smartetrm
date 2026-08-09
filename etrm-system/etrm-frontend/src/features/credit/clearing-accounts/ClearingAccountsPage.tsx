import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch, Tabs, Table, Typography, DatePicker } from 'antd';
import { EditOutlined, StopOutlined, PlusOutlined, BankOutlined, PercentageOutlined, CalculatorOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';
import { color } from '@theme/tokens';
import { useCounterparties } from '@features/trade/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useClearingAccounts, useSaveClearingAccount, useDeactivateClearingAccount } from './hooks';
import { MARGIN_CALC_METHODS, type ClearingAccount, type ClearingAccountInput } from './types';
import {
  useClearingAccountMarginRates, useSaveClearingAccountMarginRate, useDeactivateClearingAccountMarginRate,
} from './marginRates/hooks';
import { TENOR_BUCKETS, MARGIN_UNIT_TYPES, type ClearingAccountMarginRate, type ClearingAccountMarginRateInput } from './marginRates/types';
import { useMarginValuations, useSaveMarginValuation } from '@features/credit/margin-valuations/hooks';
import {
  MARGIN_VALUATION_RUN_TYPES, RECONCILIATION_STATUSES,
  type MarginValuation, type MarginValuationInput,
} from '@features/credit/margin-valuations/types';

const METHOD_COLOR: Record<string, string> = { SPAN: 'blue', VAR: 'green', GRID_FLAT: 'purple' };

interface ContractSpecRow { contractSpecId: number; specCode: string; specName: string; }

function MarginRatesTab({ clearingAccountId }: { clearingAccountId: number }) {
  const { data = [], isLoading } = useClearingAccountMarginRates(clearingAccountId);
  const { data: specs = [] } = useTableRows<ContractSpecRow>('derivative_contract_specification');
  const { data: currencies = [] } = useCurrencies();
  const save = useSaveClearingAccountMarginRate(clearingAccountId);
  const deactivate = useDeactivateClearingAccountMarginRate(clearingAccountId);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const specOpts = useMemo(
    () => specs.map((s) => ({ value: s.contractSpecId, label: `${s.specCode} — ${s.specName}` })),
    [specs],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[]).map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );

  async function submit() {
    const v = await form.validateFields();
    const input: ClearingAccountMarginRateInput = {
      ...v,
      clearingAccountId,
      effectiveFrom: v.effectiveFrom.format('YYYY-MM-DD'),
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
      rowVersion: 0,
    };
    await save.mutateAsync({ id: null, input });
    setAddOpen(false);
    form.resetFields();
  }

  const cols: ColumnsType<ClearingAccountMarginRate> = [
    { title: 'Contract Spec', dataIndex: 'contractSpecCode', width: 160, render: (v: string | null) => v ? <code>{v}</code> : '—' },
    { title: 'Tenor', dataIndex: 'tenorBucket', width: 110 },
    { title: 'Unit', dataIndex: 'marginUnitType', width: 100 },
    {
      title: 'House Initial', dataIndex: 'houseInitialMarginRate', width: 130, align: 'right' as const,
      render: (v: number, r) => `${r.marginCurrencyCode ?? ''} ${v.toLocaleString()}`,
    },
    {
      title: 'House Maint.', dataIndex: 'houseMaintenanceMarginRate', width: 130, align: 'right' as const,
      render: (v: number, r) => `${r.marginCurrencyCode ?? ''} ${v.toLocaleString()}`,
    },
    { title: 'Effective From', dataIndex: 'effectiveFrom', width: 110 },
    { title: 'Effective To', dataIndex: 'effectiveTo', width: 110, render: (v: string | null) => v ?? '—' },
    { title: 'Active', dataIndex: 'isActive', width: 70, render: (v: boolean) => <ActiveTag active={v} /> },
    {
      title: '', width: 60, render: (_: unknown, r) => r.isActive && (
        <Popconfirm title="Deactivate this margin rate?" onConfirm={() => deactivate.mutate(r.clearingAccountMarginRateId)} okText="Deactivate" okButtonProps={{ danger: true }}>
          <Button type="text" size="small" danger icon={<StopOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        The FCM's house margin rate (markup over the exchange-published rate on Derivative Contract
        Specifications) for this clearing account, per contract. Falls back to the exchange rate
        when no override exists here.
      </Typography.Text>
      <Table
        size="small"
        columns={cols}
        dataSource={data}
        loading={isLoading}
        rowKey="clearingAccountMarginRateId"
        pagination={false}
        locale={{ emptyText: 'No house margin overrides — exchange-published rates apply.' }}
        footer={() => (
          <Button size="small" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Margin Rate</Button>
        )}
      />
      {addOpen && (
        <div style={{ marginTop: 12, padding: 16, border: `1px solid ${color.border}`, borderRadius: 6 }}>
          <Form form={form} layout="vertical" initialValues={{ tenorBucket: 'ALL', marginUnitType: 'PER_LOT', isCurrent: true, isActive: true }}>
            <Space style={{ width: '100%', gap: 12 }} wrap>
              <Form.Item name="contractSpecId" label="Contract Spec" rules={[{ required: true }]} style={{ minWidth: 220 }}>
                <Select options={specOpts} showSearch optionFilterProp="label" />
              </Form.Item>
              <Form.Item name="tenorBucket" label="Tenor" style={{ width: 130 }}>
                <Select options={TENOR_BUCKETS.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
              <Form.Item name="marginUnitType" label="Unit" style={{ width: 130 }}>
                <Select options={MARGIN_UNIT_TYPES.map((u) => ({ value: u, label: u }))} />
              </Form.Item>
              <Form.Item name="marginCurrencyId" label="Currency" rules={[{ required: true }]} style={{ width: 110 }}>
                <Select options={currencyOpts} />
              </Form.Item>
              <Form.Item name="houseInitialMarginRate" label="House Initial" rules={[{ required: true }]} style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item name="houseMaintenanceMarginRate" label="House Maint." rules={[{ required: true }]} style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]} initialValue={dayjs()} style={{ width: 150 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="effectiveTo" label="Effective To" style={{ width: 150 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Space style={{ marginTop: 8 }}>
              <Button size="small" onClick={() => { setAddOpen(false); form.resetFields(); }}>Cancel</Button>
              <Button size="small" type="primary" onClick={() => { void submit(); }} loading={save.isPending}>Add</Button>
            </Space>
          </Form>
        </div>
      )}
    </div>
  );
}

function MarginValuationsTab({ clearingAccountId }: { clearingAccountId: number }) {
  const { data = [], isLoading } = useMarginValuations(clearingAccountId);
  const save = useSaveMarginValuation(clearingAccountId);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  async function submit() {
    const v = await form.validateFields();
    const input: MarginValuationInput = {
      ...v,
      clearingAccountId,
      valuationDate: v.valuationDate.format('YYYY-MM-DD'),
      spreadOffsetDiscount: v.spreadOffsetDiscount ?? 0,
      optionPremiumAmount: v.optionPremiumAmount ?? 0,
      fxRateToAccountBase: v.fxRateToAccountBase ?? 1,
      discrepancyWithFcm: v.discrepancyWithFcm ?? 0,
      rowVersion: 0,
    };
    await save.mutateAsync({ id: null, input });
    setAddOpen(false);
    form.resetFields();
  }

  const cols: ColumnsType<MarginValuation> = [
    { title: 'Date', dataIndex: 'valuationDate', width: 110 },
    { title: 'Run', dataIndex: 'runType', width: 100 },
    { title: 'Gross IM', dataIndex: 'grossInitialMargin', width: 120, align: 'right' as const, render: (v: number) => v.toLocaleString() },
    { title: 'Net Required IM', dataIndex: 'netRequiredIm', width: 130, align: 'right' as const, render: (v: number) => v.toLocaleString() },
    { title: 'VM P&L', dataIndex: 'variationMarginPnl', width: 110, align: 'right' as const, render: (v: number) => v.toLocaleString() },
    { title: 'Net Call Amount', dataIndex: 'netMarginCallAmount', width: 130, align: 'right' as const, render: (v: number) => v.toLocaleString() },
    { title: 'Discrepancy', dataIndex: 'discrepancyWithFcm', width: 110, align: 'right' as const, render: (v: number) => v.toLocaleString() },
    { title: 'Reconciliation', dataIndex: 'reconciliationStatus', width: 130 },
  ];

  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        Daily/intraday EOD margin computation and FCM-statement-reconciliation runs for this clearing
        account — the calculation that produces the numbers a Margin Call gets issued from.
      </Typography.Text>
      <Table
        size="small"
        columns={cols}
        dataSource={data}
        loading={isLoading}
        rowKey="marginValuationId"
        pagination={false}
        locale={{ emptyText: 'No valuation runs recorded yet.' }}
        footer={() => (
          <Button size="small" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Valuation Run</Button>
        )}
      />
      {addOpen && (
        <div style={{ marginTop: 12, padding: 16, border: `1px solid ${color.border}`, borderRadius: 6 }}>
          <Form form={form} layout="vertical" initialValues={{ runType: 'EOD', reconciliationStatus: 'CALCULATED', totalOpenLots: 0, spreadOffsetDiscount: 0, optionPremiumAmount: 0, fxRateToAccountBase: 1, fcmCashBalance: 0, fcmCollateralNoncash: 0, discrepancyWithFcm: 0 }}>
            <Space style={{ width: '100%', gap: 12 }} wrap>
              <Form.Item name="valuationDate" label="Valuation Date" rules={[{ required: true }]} initialValue={dayjs()} style={{ width: 150 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="runType" label="Run Type" style={{ width: 130 }}>
                <Select options={MARGIN_VALUATION_RUN_TYPES.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
              <Form.Item name="totalOpenLots" label="Total Open Lots" rules={[{ required: true }]} style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="grossInitialMargin" label="Gross IM" rules={[{ required: true }]} style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="spreadOffsetDiscount" label="Spread Offset Discount" style={{ width: 160 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="netRequiredIm" label="Net Required IM" rules={[{ required: true }]} style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="variationMarginPnl" label="VM P&L" rules={[{ required: true }]} style={{ width: 130 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="optionPremiumAmount" label="Option Premium" style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="fcmCashBalance" label="FCM Cash Balance" rules={[{ required: true }]} style={{ width: 150 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="fcmCollateralNoncash" label="FCM Non-Cash Collateral" rules={[{ required: true }]} style={{ width: 170 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="fxRateToAccountBase" label="FX Rate to Base" style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.0001} />
              </Form.Item>
              <Form.Item name="netMarginCallAmount" label="Net Margin Call Amount" rules={[{ required: true }]} style={{ width: 170 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="discrepancyWithFcm" label="Discrepancy vs FCM" style={{ width: 150 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="reconciliationStatus" label="Reconciliation" style={{ width: 150 }}>
                <Select options={RECONCILIATION_STATUSES.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Space>
            <Space style={{ marginTop: 8 }}>
              <Button size="small" onClick={() => { setAddOpen(false); form.resetFields(); }}>Cancel</Button>
              <Button size="small" type="primary" onClick={() => { void submit(); }} loading={save.isPending}>Add</Button>
            </Space>
          </Form>
        </div>
      )}
    </div>
  );
}

export function ClearingAccountsPage() {
  const { data = [], isLoading, refetch } = useClearingAccounts();
  const save = useSaveClearingAccount();
  const deactivate = useDeactivateClearingAccount();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: currencies = [] } = useCurrencies();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ClearingAccount | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [form] = Form.useForm<ClearingAccountInput>();
  useFormDraft('clearing-accounts', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    setActiveTab('details');
    form.resetFields();
    form.setFieldsValue({ marginCalcMethod: 'SPAN', targetCashBuffer: 0, isActive: true } as unknown as ClearingAccountInput);
    setOpen(true);
  }

  function openEdit(r: ClearingAccount) {
    setEditing(r);
    setActiveTab('details');
    form.setFieldsValue(r as unknown as ClearingAccountInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const input = { ...values, rowVersion: editing?.rowVersion ?? 0 };
    const saved = await save.mutateAsync({ id: editing?.clearingAccountId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const cpOpts = useMemo(
    () => counterparties.map((c) => ({ value: c.counterpartyId, label: `${c.cpCode} — ${c.legalName}` })),
    [counterparties],
  );
  const leOpts = useMemo(
    () => legalEntities.map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[]).map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );

  const colDefs = useMemo<ColDef<ClearingAccount>[]>(() => [
    { field: 'accountCode', headerName: 'Account Code', width: 170, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'accountName', headerName: 'Account Name', flex: 1, minWidth: 160 },
    { field: 'clearingBrokerName', headerName: 'Clearing Broker (FCM)', flex: 1, minWidth: 160 },
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 140 },
    { field: 'baseCurrencyCode', headerName: 'Base Ccy', width: 100 },
    { field: 'marginCalcMethod', headerName: 'Calc Method', width: 120, cellRenderer: (p: { value: string }) => <Tag color={METHOD_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: ClearingAccount }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this clearing account?" onConfirm={() => deactivate.mutate(p.data.clearingAccountId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  const tabItems = [
    {
      key: 'details',
      label: <Space><BankOutlined />Account Details</Space>,
      children: (
        <Form form={form} layout="vertical">
          <Form.Item name="accountCode" label={hint('Account Code', "e.g. 'FCM_MAREX_EEX_01'.")} rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="clearingBrokerId" label="Clearing Broker (FCM)" rules={[{ required: true }]}>
            <Select options={cpOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="baseCurrencyId" label="Base Currency" rules={[{ required: true }]}>
            <Select options={currencyOpts} />
          </Form.Item>
          <Form.Item name="marginCalcMethod" label={hint('Margin Calc Method', 'SPAN = exchange scanning-range methodology. VAR = value-at-risk based. GRID_FLAT = flat per-lot grid.')} rules={[{ required: true }]}>
            <Select options={MARGIN_CALC_METHODS.map((m) => ({ value: m, label: m }))} />
          </Form.Item>
          <Form.Item name="targetCashBuffer" label={hint('Target Cash Buffer', 'Cash the desk aims to keep posted above the calculated requirement.')}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <AuditInfo createdAt={editing?.createdAt} />
        </Form>
      ),
    },
    {
      key: 'margin-rates',
      label: <Space><PercentageOutlined />House Margin Rates</Space>,
      disabled: editing === null,
      children: editing ? <MarginRatesTab clearingAccountId={editing.clearingAccountId} /> : null,
    },
    {
      key: 'margin-valuations',
      label: <Space><CalculatorOutlined />Margin Valuations</Space>,
      disabled: editing === null,
      children: editing ? <MarginValuationsTab clearingAccountId={editing.clearingAccountId} /> : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Clearing Accounts"
        description="FCM/clearing-broker-level accounts a legal entity holds margin balances under — one account can span multiple markets. Margin accounts allocate balances per market under one of these."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Clearing Account"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.clearingAccountId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Clearing Account — ${editing.accountCode}` : 'New Clearing Account'}
        open={open}
        onClose={() => setOpen(false)}
        width={680}
        footer={
          activeTab === 'details' ? (
            <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
              <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
            </Space>
          ) : null
        }
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ padding: '0 24px 24px' }}
          tabBarStyle={{ marginBottom: 16, paddingTop: 12 }}
        />
      </Drawer>
    </>
  );
}
