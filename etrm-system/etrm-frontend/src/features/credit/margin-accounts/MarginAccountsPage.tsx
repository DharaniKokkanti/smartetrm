import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { useCounterparties } from '@features/trade/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useMarkets } from '@features/markets/markets/hooks';
import { useMarginAccounts, useSaveMarginAccount, useDeactivateMarginAccount } from './hooks';
import { MARGIN_ACCOUNT_TYPES, type MarginAccount, type MarginAccountInput } from './types';

const TYPE_COLOR: Record<string, string> = { HOUSE: 'blue', CLIENT: 'green', OMNIBUS: 'purple' };

export function MarginAccountsPage() {
  const { data = [], isLoading, refetch } = useMarginAccounts();
  const save = useSaveMarginAccount();
  const deactivate = useDeactivateMarginAccount();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: markets = [] } = useMarkets();
  const { data: counterparties = [] } = useCounterparties();
  const { data: currencies = [] } = useCurrencies();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MarginAccount | null>(null);
  const [form] = Form.useForm<MarginAccountInput>();
  useFormDraft('margin-accounts', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ accountType: 'HOUSE', initialMargin: 0, variationMargin: 0, excessMargin: 0, isActive: true } as unknown as MarginAccountInput);
    setOpen(true);
  }

  function openEdit(r: MarginAccount) {
    setEditing(r);
    form.setFieldsValue(r as unknown as MarginAccountInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.marginAccountId ?? null, input: values });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const leOpts = useMemo(
    () => (legalEntities as { legalEntityId: number; entityCode: string; entityName: string }[])
      .map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );
  const marketOpts = useMemo(
    () => (markets as { marketId: number; marketCode: string; marketName: string }[])
      .map((m) => ({ value: m.marketId, label: `${m.marketCode} — ${m.marketName}` })),
    [markets],
  );
  const cpOpts = useMemo(
    () => (counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[])
      .map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.name}` })),
    [counterparties],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[]).map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );

  const colDefs = useMemo<ColDef<MarginAccount>[]>(() => [
    { field: 'accountRef', headerName: 'Account Ref', width: 150, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 140 },
    { field: 'marketName', headerName: 'Market', flex: 1, minWidth: 130 },
    { field: 'accountType', headerName: 'Type', width: 100, cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    {
      headerName: 'Initial Margin', width: 140,
      valueGetter: (p) => `${p.data?.currencyCode} ${(p.data?.initialMargin ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      headerName: 'Variation Margin', width: 150,
      valueGetter: (p) => `${p.data?.currencyCode} ${(p.data?.variationMargin ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: MarginAccount }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this margin account?" onConfirm={() => deactivate.mutate(p.data.marginAccountId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Margin Accounts"
        description="Exchange margin accounts for cleared trades — initial and variation margin tracking per legal entity per market."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Margin Account"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.marginAccountId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Margin Account — ${editing.accountRef}` : 'New Margin Account'}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="marketId" label="Market" rules={[{ required: true }]}>
            <Select options={marketOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="accountRef" label={hint('Account Reference', 'The broker/exchange account reference number.')} rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="accountType" label={hint('Account Type', 'HOUSE = proprietary trading account. CLIENT = client segregated account. OMNIBUS = pooled client account.')} rules={[{ required: true }]}>
            <Select options={MARGIN_ACCOUNT_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="clearingBrokerId" label="Clearing Broker">
            <Select options={cpOpts} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="currencyId" label="Currency" rules={[{ required: true }]}>
            <Select options={currencyOpts} />
          </Form.Item>
          <Form.Item
            name="initialMargin"
            label={hint('Initial Margin', 'Current initial margin balance — in a real system, updated automatically by the EOD batch; enter directly here for now.')}
            rules={[{ type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="variationMargin" label="Variation Margin">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="excessMargin" label="Excess Margin">
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="marginLimit" label="Margin Limit" rules={[{ type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
