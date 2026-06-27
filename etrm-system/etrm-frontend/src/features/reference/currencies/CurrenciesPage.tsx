import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined, StarFilled } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useCurrencies, useSaveCurrency, useDeactivateCurrency } from './hooks';
import type { Currency, CurrencyInput } from './types';

export function CurrenciesPage() {
  const { data, isLoading, refetch } = useCurrencies();
  const save = useSaveCurrency();
  const deactivate = useDeactivateCurrency();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [form] = Form.useForm<CurrencyInput>();

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ decimalPlaces: 2, isBaseCurrency: false, isActive: true }); setOpen(true); }
  function openEdit(r: Currency) { setEditing(r); form.setFieldsValue({ ...r }); setOpen(true); }
  async function submit() { const v = await form.validateFields(); await save.mutateAsync({ id: editing?.currencyId ?? null, input: v }); setOpen(false); }

  const colDefs = useMemo<ColDef<Currency>[]>(() => [
    { field: 'currencyCode', headerName: 'Code', width: 80, pinned: 'left', cellClass: 'cell-mono',
      cellRenderer: (p: { value: string }) => <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.value}</Tag> },
    { field: 'currencyName', headerName: 'Currency Name', flex: 1.5, minWidth: 180 },
    { field: 'symbol', headerName: 'Symbol', width: 70, cellRenderer: (p: { value: string }) => <span style={{ fontSize: 16 }}>{p.value}</span> },
    { field: 'countryCode', headerName: 'Country', width: 80, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'decimalPlaces', headerName: 'Decimals', width: 90, type: 'numericColumn' },
    { field: 'isBaseCurrency', headerName: 'Base', width: 70,
      cellRenderer: (p: { value: boolean }) => p.value ? <StarFilled style={{ color: '#faad14' }} /> : null },
    { field: 'isActive', headerName: 'Status', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Currency }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate?" onConfirm={() => deactivate.mutate(p.data.currencyId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )},
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Currencies" description="ISO 4217 currency codes used across all trade, pricing, and settlement records." moduleGroup="reference" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Currency" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.currencyId)} />
      <Drawer title={editing ? `Edit ${editing.currencyCode}` : 'New Currency'} open={open} onClose={() => setOpen(false)} width={460}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={submit} loading={save.isPending}>Save</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="currencyCode" label={hint('Currency Code', 'ISO 4217 three-letter code — USD, EUR, GBP. Cannot be changed once used in a trade.', 'USD')} rules={[{ required: true, max: 3 }]}>
            <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 700 }} />
          </Form.Item>
          <Form.Item name="currencyName" label="Currency Name" rules={[{ required: true }]}>
            <Input placeholder="US Dollar" />
          </Form.Item>
          <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
            <Input placeholder="$" maxLength={4} />
          </Form.Item>
          <Form.Item name="countryCode" label={hint('Country Code', 'ISO 3166-1 alpha-2 country code. Leave blank for supranational currencies (EUR).', 'US')}>
            <Input placeholder="US" maxLength={2} style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="decimalPlaces" label={hint('Decimal Places', 'JPY = 0, most currencies = 2. Affects rounding on all trade valuations in this currency.')}>
            <InputNumber min={0} max={8} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isBaseCurrency" label="Base / Reporting Currency" valuePropName="checked">
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
