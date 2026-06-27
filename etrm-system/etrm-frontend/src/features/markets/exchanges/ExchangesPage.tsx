import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useExchanges, useSaveExchange, useDeactivateExchange } from './hooks';
import { EXCHANGE_TYPES, type Exchange, type ExchangeInput } from './types';

const TYPE_COLOR: Record<string, string> = {
  EXCHANGE: 'blue', ECN: 'purple', OTC_PLATFORM: 'cyan', DARK_POOL: 'default',
};

export function ExchangesPage() {
  const { data, isLoading, refetch } = useExchanges();
  const save = useSaveExchange();
  const deactivate = useDeactivateExchange();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exchange | null>(null);
  const [form] = Form.useForm<ExchangeInput>();

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(e: Exchange) { setEditing(e); form.setFieldsValue({ exchangeCode: e.exchangeCode, exchangeName: e.exchangeName, exchangeType: e.exchangeType, countryCode: e.countryCode, timezone: e.timezone, currencyCode: e.currencyCode, regulator: e.regulator ?? undefined, micCode: e.micCode ?? undefined, clearingHouse: e.clearingHouse ?? undefined, isActive: e.isActive }); setOpen(true); }
  async function submit() { const v = await form.validateFields(); await save.mutateAsync({ id: editing?.exchangeId ?? null, input: v }); setOpen(false); }

  const colDefs = useMemo<ColDef<Exchange>[]>(() => [
    { field: 'exchangeCode', headerName: 'Code', cellClass: 'cell-mono', width: 100, pinned: 'left' },
    { field: 'exchangeName', headerName: 'Exchange', flex: 1.4, minWidth: 180 },
    { field: 'exchangeType', headerName: 'Type', width: 130, cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'countryCode', headerName: 'Country', width: 90, cellClass: 'cell-mono' },
    { field: 'timezone', headerName: 'Timezone', width: 160 },
    { field: 'currencyCode', headerName: 'CCY', width: 75, cellClass: 'cell-mono' },
    { field: 'micCode', headerName: 'MIC', width: 90, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'ISO 10383 Market Identifier Code — unique 4-character exchange identifier used in MiFID II reporting' },
    { field: 'regulator', headerName: 'Regulator', width: 120, valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Financial regulator overseeing this exchange — CFTC (US), FCA (UK), ESMA (EU), MAS (SG)' },
    { field: 'clearingHouse', headerName: 'CCP', width: 120, valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Central Counterparty Clearing House that manages margin and default — LCH, CME Clearing, ICE Clear Europe' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Exchange }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate exchange?" onConfirm={() => deactivate.mutate(p.data.exchangeId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Exchanges" description="Trading exchanges and OTC platforms — ICE, NYMEX, LME, EEX, CME and bilateral OTC venues." moduleGroup="markets" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Exchange" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.exchangeId)} />

      <Drawer title={editing ? `Edit Exchange — ${editing.exchangeCode}` : 'New Exchange'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={submit} loading={save.isPending}>Save</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="exchangeCode" label={hint('Exchange Code', 'Short code used internally for this venue. Typically follows the exchange\'s own abbreviation.', 'ICE, NYMEX, LME, EEX')} rules={[{ required: true }]}>
            <Input placeholder="ICE" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="exchangeName" label={hint('Full Name', 'Official legal name of the exchange or trading venue.', 'Intercontinental Exchange')} rules={[{ required: true }]}>
            <Input placeholder="Intercontinental Exchange" />
          </Form.Item>
          <Form.Item name="exchangeType" label={hint('Venue Type', 'EXCHANGE: regulated trading venue. ECN: electronic communications network. OTC_PLATFORM: voice or electronic OTC (e.g. ICAP, Marex). DARK_POOL: anonymous off-exchange matching.', 'EXCHANGE')} rules={[{ required: true }]}>
            <Select options={EXCHANGE_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="countryCode" label={hint('Country', 'ISO 3166-1 alpha-2 country code where the exchange is domiciled.', 'GB, US, DE')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="GB" maxLength={2} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="currencyCode" label={hint('Currency', 'Primary settlement currency of the exchange.', 'USD')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
          </Space>
          <Form.Item name="timezone" label={hint('Timezone', 'IANA timezone for trading hours. Affects session open/close, LTD calculations, and same-day pricing cutoffs.', 'Europe/London, America/New_York')} rules={[{ required: true }]}>
            <Input placeholder="Europe/London" />
          </Form.Item>
          <Form.Item name="micCode" label={hint('MIC Code', 'ISO 10383 Market Identifier Code — mandatory for MiFID II transaction reporting. 4-character alphanumeric assigned by ISO. Leave blank for OTC venues.', 'XICE (ICE Futures Europe)', 'XXXX')}>
            <Input placeholder="XICE" maxLength={4} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="regulator" label={hint('Regulator', 'Supervisory authority. CFTC (US commodity futures), FCA (UK), ESMA (EU), ASIC (Australia), MAS (Singapore), BaFin (Germany).', 'FCA')}>
            <Input placeholder="FCA" />
          </Form.Item>
          <Form.Item name="clearingHouse" label={hint('Clearing House (CCP)', 'Central counterparty that becomes buyer to every seller and seller to every buyer — guarantees settlement if a counterparty defaults. Key for margin calculation.', 'LCH Ltd, ICE Clear Europe, CME Clearing')}>
            <Input placeholder="LCH Ltd" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
