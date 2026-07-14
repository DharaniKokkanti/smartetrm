import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined, StarFilled } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useCurrencies, useSaveCurrency, useDeactivateCurrency } from './hooks';
import type { Currency, CurrencyInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { useCountries } from '@features/reference/countries/hooks';

export function CurrenciesPage() {
  const { data, isLoading, refetch } = useCurrencies();
  const { data: countries } = useCountries();
  const save = useSaveCurrency();
  const deactivate = useDeactivateCurrency();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);
  const [form] = Form.useForm<CurrencyInput>();
  useFormDraft('ref-currencies', { form, open, setOpen, editing, setEditing });

  const countryOptions = useMemo(
    () => (countries ?? []).map((c) => ({ value: c.countryId, label: `${c.countryCode} — ${c.countryName}` })),
    [countries],
  );
  const countryCodeById = useMemo(
    () => new Map((countries ?? []).map((c) => [c.countryId, c.countryCode])),
    [countries],
  );

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ decimalPlaces: 2, isBaseCurrency: false, isActive: true }); setOpen(true); }
  function openEdit(r: Currency) { setEditing(r); form.setFieldsValue({ ...r }); setOpen(true); }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.currencyId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Currency>[]>(() => [
    { field: 'currencyCode', headerName: 'Code', width: 80, pinned: 'left', cellClass: 'cell-mono',
      cellRenderer: (p: { value: string }) => <Tag color="blue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.value}</Tag> },
    { field: 'currencyName', headerName: 'Currency Name', flex: 1.5, minWidth: 180 },
    { field: 'symbol', headerName: 'Symbol', width: 70, cellRenderer: (p: { value: string }) => <span style={{ fontSize: 16 }}>{p.value}</span> },
    { field: 'countryId', headerName: 'Country', width: 80, cellClass: 'cell-mono',
      valueFormatter: (p) => (p.value != null ? countryCodeById.get(p.value) ?? '—' : '—') },
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
  ], [deactivate, countryCodeById]);

  return (
    <>
      <PageHeader title="Currencies" description="ISO 4217 currency codes used across all trade, pricing, and settlement records." moduleGroup="reference" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Currency" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.currencyId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit ${editing.currencyCode}` : 'New Currency'} open={open} onClose={() => setOpen(false)} width={460}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="currencyCode" label={hint('Currency Code', 'ISO 4217 three-letter code — USD, EUR, GBP. Cannot be changed once used in a trade.', 'USD')} rules={[{ required: true, max: 3 }]}>
            <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 700 }} />
          </Form.Item>
          <Form.Item name="currencyName" label="Currency Name" rules={[{ required: true }]}>
            <Input placeholder="US Dollar" maxLength={100} showCount />
          </Form.Item>
          <Form.Item name="symbol" label="Symbol" rules={[{ required: true }]}>
            <Input placeholder="$" maxLength={4} />
          </Form.Item>
          <Form.Item name="countryId" label={hint('Country', 'Leave blank for supranational currencies (EUR).')}>
            <Select showSearch optionFilterProp="label" options={countryOptions} allowClear placeholder="Select country…" />
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
