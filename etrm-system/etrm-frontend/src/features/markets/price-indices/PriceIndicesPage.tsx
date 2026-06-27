import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { usePriceIndices, useSavePriceIndex, useDeactivatePriceIndex } from './hooks';
import { PUBLICATION_SOURCES, type PriceIndex, type PriceIndexInput } from './types';
import { COMMODITY_TYPES, type CommodityType } from '@features/organization/desks/types';

const SOURCE_COLOR: Record<string, string> = {
  PLATTS: 'blue', ARGUS: 'cyan', ICE: 'purple', LME: 'gold',
  BLOOMBERG: 'orange', REUTERS: 'geekblue', NYMEX: 'magenta', INTERNAL: 'default',
};
const COMMODITY_COLOR: Record<CommodityType, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
};

export function PriceIndicesPage() {
  const { data, isLoading, refetch } = usePriceIndices();
  const save = useSavePriceIndex();
  const deactivate = useDeactivatePriceIndex();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PriceIndex | null>(null);
  const [activeCommodity, setActiveCommodity] = useState<'ALL' | CommodityType>('ALL');
  const [form] = Form.useForm<PriceIndexInput>();

  const filtered = useMemo(
    () => (data ?? []).filter((p) => activeCommodity === 'ALL' || p.commodityType === activeCommodity),
    [data, activeCommodity],
  );

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(p: PriceIndex) {
    setEditing(p);
    form.setFieldsValue({ indexCode: p.indexCode, indexName: p.indexName, commodityType: p.commodityType, currencyCode: p.currencyCode, uomCode: p.uomCode, publicationSource: p.publicationSource, fixingTime: p.fixingTime ?? undefined, fixingTimezone: p.fixingTimezone ?? undefined, publishedPage: p.publishedPage ?? undefined, isActive: p.isActive });
    setOpen(true);
  }
  async function submit() { const v = await form.validateFields(); await save.mutateAsync({ id: editing?.priceIndexId ?? null, input: v }); setOpen(false); }

  const colDefs = useMemo<ColDef<PriceIndex>[]>(() => [
    { field: 'indexCode', headerName: 'Index Code', cellClass: 'cell-mono', width: 170, pinned: 'left',
      tooltipValueGetter: () => 'Unique code identifying this benchmark — used in pricing formulas, pricing rules, and market data feeds' },
    { field: 'indexName', headerName: 'Index Name', flex: 1.4, minWidth: 220 },
    { field: 'commodityType', headerName: 'Commodity', width: 120, cellRenderer: (p: { value: CommodityType }) => <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag> },
    {
      field: 'publicationSource', headerName: 'Source', width: 110,
      tooltipValueGetter: () => 'Data vendor that publishes this index — Platts (S&P Global Commodity Insights), Argus, ICE, LME, Bloomberg, Reuters/Refinitiv',
      cellRenderer: (p: { value: string }) => <Tag color={SOURCE_COLOR[p.value] ?? 'default'}>{p.value}</Tag>,
    },
    { field: 'currencyCode', headerName: 'CCY', width: 75, cellClass: 'cell-mono' },
    { field: 'uomCode', headerName: 'UoM', width: 90, cellClass: 'cell-mono' },
    { field: 'fixingTime', headerName: 'Fixing Time', width: 120, valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Time of day when the official price is published. Critical for same-day pricing trigger cutoffs.' },
    { field: 'fixingTimezone', headerName: 'Timezone', width: 110, valueFormatter: (p) => p.value ?? '—' },
    { field: 'publishedPage', headerName: 'Screen Page', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Bloomberg/Reuters screen page reference for the fixing — used for dispute resolution evidence' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PriceIndex }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate index?" description="Pricing formulas referencing this index will need updating." onConfirm={() => deactivate.mutate(p.data.priceIndexId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Price Indices" description="Market benchmark indices — Platts, Argus, ICE, LME and internal curves used in pricing formulas, MTM, and settlement." moduleGroup="markets" />
      <SmartGrid columnDefs={colDefs} rowData={filtered} loading={isLoading}
        onAdd={openNew} addLabel="New Index"
        commodityFilter activeCommodity={activeCommodity} onCommodityChange={(c) => setActiveCommodity(c as 'ALL' | CommodityType)}
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.priceIndexId)} />

      <Drawer title={editing ? `Edit Index — ${editing.indexCode}` : 'New Price Index'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={submit} loading={save.isPending}>Save</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="indexCode" label={hint('Index Code', 'Canonical code for this benchmark. Use the industry-standard code from the publication source (e.g. Platts uses DTBRT for Dated Brent, Argus uses PA0003858). This code is used in pricing formula expressions.', 'DATED_BRENT')} rules={[{ required: true }]}>
            <Input placeholder="DATED_BRENT" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="indexName" label={hint('Index Name', 'Full descriptive name as published by the price reporting agency.', 'Dated Brent Crude Oil')} rules={[{ required: true }]}>
            <Input placeholder="Dated Brent Crude Oil" />
          </Form.Item>
          <Form.Item name="commodityType" label={hint('Commodity', 'Commodity class this index prices. Determines which products can use this index in pricing rules.')} rules={[{ required: true }]}>
            <Select options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Form.Item name="publicationSource" label={hint('Publication Source', 'Price reporting agency or exchange that publishes and maintains this index. PLATTS = S&P Global Commodity Insights; ARGUS = Argus Media; LME = London Metal Exchange official settlement.', 'PLATTS')} rules={[{ required: true }]}>
            <Select options={PUBLICATION_SOURCES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="currencyCode" label={hint('Currency', 'Currency in which the index is published. Most oil indices publish in USD/BBL. LME publishes in USD/MT.', 'USD')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="uomCode" label={hint('Unit of Measure', 'Quantity unit for the published price. Oil: BBL or MT. Gas: MMBTU. Power: MWH. Metals: MT or TROY_OZ.', 'BBL')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="BBL" maxLength={10} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="fixingTime" label={hint('Fixing Time', 'Time of day (local to the exchange/publisher) when the index price is officially set. Platts Dated Brent: 16:30 London. LME ring: 13:00 London. ICE close: varies.', '16:30', 'HH:MM')} style={{ flex: 1 }}>
              <Input placeholder="16:30" />
            </Form.Item>
            <Form.Item name="fixingTimezone" label={hint('Timezone', 'Timezone of the fixing time. Use IANA timezone identifiers.', 'Europe/London')} style={{ flex: 1 }}>
              <Input placeholder="Europe/London" />
            </Form.Item>
          </Space>
          <Form.Item name="publishedPage" label={hint('Screen Page', 'Bloomberg or Reuters terminal screen reference for this fixing. Used as primary evidence source in pricing disputes. Bloomberg: e.g. BCOM. Reuters: e.g. CRUDE/EU3.', 'PXBR01 (Platts page)')}>
            <Input placeholder="e.g. PXBR01" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
