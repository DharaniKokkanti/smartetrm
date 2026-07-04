import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch,
  InputNumber, Table,
} from 'antd';
import { EditOutlined, StopOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import {
  usePriceSources, useSavePriceSource, useDeactivatePriceSource,
  usePriceIndexSources, useSavePriceIndexSource, useRemovePriceIndexSource,
} from './hooks';
import {
  SOURCE_TYPES, DELIVERY_METHODS, FREQUENCIES, SOURCE_ROLES,
  type PriceSource, type PriceSourceInput, type SourceType, type PriceIndexSource,
  type PriceIndexSourceInput,
} from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';

const TYPE_COLOR: Record<SourceType, string> = {
  EXCHANGE: 'blue', VENDOR: 'green', BROKER: 'purple', BLOOMBERG: 'cyan',
  REUTERS: 'orange', INTERNAL: 'default', OTHER: 'default',
};
const ROLE_COLOR: Record<string, string> = {
  PRIMARY_MTM: 'blue', SETTLEMENT: 'green', BACKUP: 'orange', REFERENCE: 'default',
};
const FREQ_COLOR: Record<string, string> = {
  REAL_TIME: 'red', INTRADAY: 'orange', EOD: 'green', WEEKLY: 'default', MANUAL: 'default',
};

// ─── Index-Source Links Drawer ─────────────────────────────────────────────────
function IndexLinksDrawer({ source, onClose }: { source: PriceSource; onClose: () => void }) {
  const { data: links, isLoading } = usePriceIndexSources(source.priceSourceId);
  const save = useSavePriceIndexSource();
  const remove = useRemovePriceIndexSource();
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<PriceIndexSource | null>(null);
  const [form] = Form.useForm<PriceIndexSourceInput>();

  function openAdd() { setEditing(null); form.resetFields(); form.setFieldsValue({ priceSourceId: source.priceSourceId, priceMultiplier: 1, priceOffset: 0, isActive: true, effectiveFrom: dayjs().format('YYYY-MM-DD') as unknown as string }); setAddOpen(true); }
  function openEdit(l: PriceIndexSource) {
    setEditing(l);
    form.setFieldsValue({ priceIndexId: l.priceIndexId, priceSourceId: l.priceSourceId, sourceRole: l.sourceRole, sourceFieldCode: l.sourceFieldCode ?? undefined, sourceTicker: l.sourceTicker ?? undefined, priceMultiplier: l.priceMultiplier, priceOffset: l.priceOffset, effectiveFrom: dayjs(l.effectiveFrom) as unknown as string, effectiveTo: l.effectiveTo ? dayjs(l.effectiveTo) as unknown as string : undefined, isActive: l.isActive });
    setAddOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const input: PriceIndexSourceInput = {
      ...v,
      effectiveFrom: dayjs(v.effectiveFrom as unknown as dayjs.Dayjs).format('YYYY-MM-DD'),
      effectiveTo: v.effectiveTo ? dayjs(v.effectiveTo as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    };
    await save.mutateAsync({ id: editing?.pisId ?? null, input });
    if (closeAfter) { setAddOpen(false); } else { setEditing(null); form.resetFields(); }
  }

  return (
    <Drawer mask={false} forceRender
      title={<Space><Tag>{source.sourceCode}</Tag>Price Index Links</Space>}
      open onClose={onClose} width={680}
      extra={<Button icon={<PlusOutlined />} type="primary" size="small" onClick={openAdd}>Link Index</Button>}
    >
      <div style={{ marginBottom: 12, fontSize: 12, color: '#888' }}>
        Each price index can have one primary MTM source, one settlement source, and optional backups. The SOURCE_FIELD_CODE / TICKER maps to the vendor-specific field identifier used when loading prices.
      </div>
      <Table
        dataSource={links}
        rowKey="pisId"
        pagination={false}
        size="small"
        loading={isLoading}
        columns={[
          { title: 'Price Index', dataIndex: 'priceIndexCode', width: 120, render: (v: string) => <code style={{ fontFamily: 'monospace' }}>{v}</code> },
          { title: 'Index Name', dataIndex: 'priceIndexName', width: 220 },
          { title: 'Role', dataIndex: 'sourceRole', width: 130,
            render: (v: string) => <Tag color={ROLE_COLOR[v] ?? 'default'}>{v.replace('_', ' ')}</Tag> },
          { title: 'Field Code', dataIndex: 'sourceFieldCode', width: 110, render: (v: string | null) => v ? <code style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</code> : '—' },
          { title: 'Ticker', dataIndex: 'sourceTicker', width: 110, render: (v: string | null) => v ? <code style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</code> : '—' },
          { title: 'Multiplier', dataIndex: 'priceMultiplier', width: 90, render: (v: number) => v === 1 ? '—' : v },
          { title: 'From', dataIndex: 'effectiveFrom', width: 90, render: (v: string) => dayjs(v).format('DD MMM YY') },
          { title: 'Active', dataIndex: 'isActive', width: 70, render: (v: boolean) => <ActiveTag active={v} /> },
          {
            title: '', width: 80,
            render: (_: unknown, r: PriceIndexSource) => (
              <Space size={4}>
                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)} />
                <Popconfirm title="Remove link?" onConfirm={() => remove.mutate(r.pisId)} okButtonProps={{ danger: true }}>
                  <Button type="text" size="small" danger icon={<StopOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      {addOpen && (
        <div style={{ marginTop: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
          <Form form={form} layout="vertical">
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item name="priceIndexId" label={hint('Price Index ID', 'ID from the Price Indices master data table. The index must already exist. Multiple roles can link the same index-source pair with different roles.', '1')} rules={[{ required: true }]} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="sourceRole" label={hint('Role', 'PRIMARY_MTM: used every day for mark-to-market. SETTLEMENT: used only at contract expiry (may differ from MTM — e.g. NYMEX settlement vs Bloomberg spot). BACKUP: fallback if primary fails SLA. REFERENCE: cross-check only, not used in calculations.', 'PRIMARY_MTM')} rules={[{ required: true }]} style={{ flex: 1 }}>
                <Select options={SOURCE_ROLES.map((r) => ({ label: r.replace('_', ' '), value: r }))} />
              </Form.Item>
            </Space>
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item name="sourceFieldCode" label={hint('Source Field Code', 'Vendor-specific field/page code for this price. Platts uses mnemonics like PCAAS00 for Dated Brent. Argus uses AP codes. Required for automated price loading.', 'PCAAS00, AAQUA, AP-0001')} style={{ flex: 1 }}>
                <Input placeholder="PCAAS00" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
              <Form.Item name="sourceTicker" label={hint('Source Ticker', 'Bloomberg ticker, Reuters RIC, or exchange contract code. Used when pulling from feed rather than direct vendor API.', 'CO1 (Brent), CL1 (WTI), LMCADY (LME Cu Cash)')} style={{ flex: 1 }}>
                <Input placeholder="CO1" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Space>
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item name="priceMultiplier" label={hint('Price Multiplier', 'Multiply raw source price by this factor. Use when source quotes in different units — e.g. source gives price per ton, you need per barrel: multiply by 7.45.', '1.0 (most cases), 7.45 (MT to BBL conversion)')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} step={0.000001} />
              </Form.Item>
              <Form.Item name="priceOffset" label={hint('Price Offset', 'Add this constant to the raw price after multiplier is applied. Used for basis adjustments — e.g. source gives FOB price, you need CIF: add freight component.', '0 (most cases)')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} step={0.01} />
              </Form.Item>
            </Space>
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]} style={{ flex: 1 }}>
                <AppDatePicker />
              </Form.Item>
              <Form.Item name="effectiveTo" label={hint('Effective To', 'Leave blank for currently active links. Set to end date when switching to a new source — keeps history intact.')} style={{ flex: 1 }}>
                <AppDatePicker />
              </Form.Item>
            </Space>
            <Space>
              <Button size="small" onClick={() => { void submit(false); }} loading={save.isPending}>Save & Next</Button>
              <Button type="primary" size="small" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
              <Button size="small" onClick={() => { setAddOpen(false); form.resetFields(); }}>Cancel</Button>
            </Space>
          </Form>
        </div>
      )}
    </Drawer>
  );
}

// ─── Main Price Sources Page ───────────────────────────────────────────────────
export function PriceSourcesPage() {
  const { data, isLoading, refetch } = usePriceSources();
  const save = useSavePriceSource();
  const deactivate = useDeactivatePriceSource();
  const [editOpen, setEditOpen] = useState(false);
  const [linksSource, setLinksSource] = useState<PriceSource | null>(null);
  const [editing, setEditing] = useState<PriceSource | null>(null);
  const [form] = Form.useForm<PriceSourceInput>();
  useFormDraft('pricing-price-sources', { form, open: editOpen, setOpen: setEditOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ isActive: true, deliveryMethod: 'API', frequency: 'EOD' }); setEditOpen(true); }
  function openEdit(s: PriceSource) {
    setEditing(s);
    form.setFieldsValue({ sourceCode: s.sourceCode, sourceName: s.sourceName, sourceType: s.sourceType, deliveryMethod: s.deliveryMethod, frequency: s.frequency, timezone: s.timezone ?? undefined, baseUrl: s.baseUrl ?? undefined, credentialsRef: s.credentialsRef ?? undefined, slaMinutes: s.slaMinutes, isActive: s.isActive });
    setEditOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.priceSourceId ?? null, input: v });
    if (closeAfter) setEditOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<PriceSource>[]>(() => [
    { field: 'sourceCode', headerName: 'Source Code', cellClass: 'cell-mono', width: 130, pinned: 'left',
      tooltipValueGetter: () => 'Short code used in price loading configuration — referenced by pricing rules and market-product-source links' },
    { field: 'sourceName', headerName: 'Source Name', flex: 1.4, minWidth: 200 },
    { field: 'sourceType', headerName: 'Type', width: 120, cellRenderer: (p: { value: SourceType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'deliveryMethod', headerName: 'Delivery', width: 130, cellRenderer: (p: { value: string }) => <Tag>{p.value.replace('_', ' ')}</Tag> },
    { field: 'frequency', headerName: 'Frequency', width: 110, cellRenderer: (p: { value: string }) => <Tag color={FREQ_COLOR[p.value] ?? 'default'}>{p.value.replace('_', ' ')}</Tag> },
    { field: 'timezone', headerName: 'Timezone', width: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'slaMinutes', headerName: 'SLA (min)', width: 100, cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? `${p.value} min` : '—',
      tooltipValueGetter: () => 'Expected minutes after market close for prices to be available. Used for price loading monitoring and alerts.' },
    { field: 'credentialsRef', headerName: 'Credentials Ref', width: 140, valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Reference to secrets vault key — never stores actual credentials in the database' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 115, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PriceSource }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<LinkOutlined />} onClick={() => setLinksSource(p.data)} title="Index Links" />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate price source?" onConfirm={() => deactivate.mutate(p.data.priceSourceId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Price Sources"
        description="Price data vendors and feeds — Platts, Argus, Bloomberg, ICE Data, LME. Each source links to price indices it provides and defines the delivery method, frequency, and SLA."
        moduleGroup="pricing"
      />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Price Source" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.priceSourceId)} />

      {linksSource && <IndexLinksDrawer source={linksSource} onClose={() => setLinksSource(null)} />}

      <Drawer mask={false} forceRender
        title={editing ? `Edit Price Source — ${editing.sourceCode}` : 'New Price Source'}
        open={editOpen} onClose={() => setEditOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="sourceCode" label={hint('Source Code', 'Short code used internally and in configuration files. Industry-standard: PLATTS, ARGUS, BLOOMBERG, ICE_DATA, NYMEX_DATA, LME_DATA, REUTERS.', 'PLATTS, ARGUS, BLOOMBERG')} rules={[{ required: true }]}>
            <Input placeholder="PLATTS" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="sourceName" label="Source Name" rules={[{ required: true }]}>
            <Input placeholder="S&P Global Platts" />
          </Form.Item>
          <Form.Item name="sourceType" label={hint('Source Type', 'EXCHANGE: official settlement prices from an exchange. VENDOR: price reporting agency (PRA) — Platts, Argus, ICIS. These are used as legal evidence in pricing disputes. BLOOMBERG/REUTERS: terminal/feed-based composite prices. INTERNAL: manually entered or calculated.', 'VENDOR')} rules={[{ required: true }]}>
            <Select options={SOURCE_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="deliveryMethod" label={hint('Delivery Method', 'API: REST or proprietary API (Platts Connect, Argus Direct). REAL_TIME_FEED: streaming — Bloomberg B-PIPE, Refinitiv Elektron. FTP/SFTP: file-based batch. MANUAL: user-keyed into the system.', 'API')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={DELIVERY_METHODS.map((d) => ({ label: d.replace('_', ' '), value: d }))} />
            </Form.Item>
            <Form.Item name="frequency" label={hint('Frequency', 'REAL_TIME: tick data (Bloomberg, Reuters). INTRADAY: multiple fixes per day. EOD: single end-of-day assessment (Platts, Argus). MANUAL: no fixed schedule.', 'EOD')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={FREQUENCIES.map((f) => ({ label: f.replace('_', ' '), value: f }))} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="timezone" label={hint('Timezone', 'Timezone of published prices — determines when the EOD assessment is released and price loading should trigger.', 'Europe/London for Platts Dated Brent')} style={{ flex: 1 }}>
              <Input placeholder="Europe/London" />
            </Form.Item>
            <Form.Item name="slaMinutes" label={hint('SLA (minutes)', 'Minutes after market close when prices are expected to be available. Platts Dated Brent: ~60 min after 16:30 London. Used to trigger alerts if loading is late.', '60, 90, 120')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="60" />
            </Form.Item>
          </Space>
          <Form.Item name="baseUrl" label={hint('Base URL / Endpoint', 'API base URL or FTP host. Used by the price loader service. Example: https://api.platts.com/price/v1. Never store credentials here.', 'https://api.platts.com/price/v1')}>
            <Input placeholder="https://api.platts.com/price/v1" />
          </Form.Item>
          <Form.Item name="credentialsRef" label={hint('Credentials Reference', 'Key name in the secrets vault (e.g. AWS Secrets Manager, HashiCorp Vault) where API credentials are stored. Never put actual API keys in this field.', 'prod/platts/api-key, vault:platts/credentials')}>
            <Input placeholder="prod/platts/api-key" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
