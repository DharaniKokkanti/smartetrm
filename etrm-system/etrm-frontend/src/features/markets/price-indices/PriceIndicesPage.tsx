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
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useUom } from '@features/reference/uom/hooks';
import { useMarketProductLinkOptions } from '@features/calendar/periods/hooks';

const SOURCE_COLOR: Record<string, string> = {
  PLATTS: 'blue', ARGUS: 'cyan', ICE: 'purple', LME: 'gold',
  BLOOMBERG: 'orange', REUTERS: 'geekblue', NYMEX: 'magenta', INTERNAL: 'default',
};

export function PriceIndicesPage() {
  const { data, isLoading, refetch } = usePriceIndices();
  const save = useSavePriceIndex();
  const deactivate = useDeactivatePriceIndex();
  const { data: currencies = [] } = useCurrencies();
  const currencyOpts = currencies.map((c) => ({ value: c.currencyId, label: c.currencyCode }));
  const { data: uoms = [] } = useUom();
  const uomOpts = uoms.map((u) => ({ value: u.uomId, label: u.uomCode }));
  const { data: marketProductLinks = [] } = useMarketProductLinkOptions();
  const listingOpts = marketProductLinks.map((mp) => ({
    value: mp.marketProductLinkId, label: `${mp.marketCode ?? '—'} / ${mp.productCode ?? '—'}`,
  }));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PriceIndex | null>(null);
  const [form] = Form.useForm<PriceIndexInput>();
  useFormDraft('markets-price-indices', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(p: PriceIndex) {
    setEditing(p);
    form.setFieldsValue({ indexCode: p.indexCode, indexName: p.indexName, currencyId: p.currencyId, uomId: p.uomId, publicationSource: p.publicationSource, fixingTime: p.fixingTime ?? undefined, fixingTimezone: p.fixingTimezone ?? undefined, publishedPage: p.publishedPage ?? undefined, marketProductLinkId: p.marketProductLinkId ?? undefined, isActive: p.isActive, rowVersion: p.rowVersion });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.priceIndexId ?? null, input: { ...v, rowVersion: editing?.rowVersion ?? 0 } });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<PriceIndex>[]>(() => [
    { field: 'indexCode', headerName: 'Index Code', cellClass: 'cell-mono', width: 170, pinned: 'left',
      tooltipValueGetter: () => 'Unique code identifying this benchmark — used in pricing formulas, pricing rules, and market data feeds' },
    { field: 'indexName', headerName: 'Index Name', flex: 1.4, minWidth: 220 },
    {
      field: 'publicationSource', headerName: 'Source', width: 110,
      tooltipValueGetter: () => 'Data vendor that publishes this index — Platts (S&P Global Commodity Insights), Argus, ICE, LME, Bloomberg, Reuters/Refinitiv',
      cellRenderer: (p: { value: string }) => <Tag color={SOURCE_COLOR[p.value] ?? 'default'}>{p.value}</Tag>,
    },
    { field: 'marketCode', headerName: 'Listing', width: 130,
      tooltipValueGetter: () => 'Primary listing this index is quick-picked from — the full sourcing map (including any other listings) lives on Price Index Sources',
      valueGetter: (p) => p.data?.marketCode && p.data?.productCode ? `${p.data.marketCode} / ${p.data.productCode}` : null,
      valueFormatter: (p) => p.value ?? '—' },
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
      <SmartGrid columnDefs={colDefs} rowData={data ?? []} loading={isLoading}
        onAdd={openNew} addLabel="New Index"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.priceIndexId)} />

      <Drawer mask={false} forceRender title={editing ? `Edit Index — ${editing.indexCode}` : 'New Price Index'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="indexCode" label={hint('Index Code', 'Canonical code for this benchmark. Use the industry-standard code from the publication source (e.g. Platts uses DTBRT for Dated Brent, Argus uses PA0003858). This code is used in pricing formula expressions.', 'DATED_BRENT')} rules={[{ required: true }]}>
            <Input placeholder="DATED_BRENT" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="indexName" label={hint('Index Name', 'Full descriptive name as published by the price reporting agency.', 'Dated Brent Crude Oil')} rules={[{ required: true }]}>
            <Input placeholder="Dated Brent Crude Oil" />
          </Form.Item>
          <Form.Item name="publicationSource" label={hint('Publication Source', 'Price reporting agency or exchange that publishes and maintains this index. PLATTS = S&P Global Commodity Insights; ARGUS = Argus Media; LME = London Metal Exchange official settlement.', 'PLATTS')} rules={[{ required: true }]}>
            <Select options={PUBLICATION_SOURCES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="currencyId" label={hint('Currency', 'Currency in which the index is published. Most oil indices publish in USD/BBL. LME publishes in USD/MT.', 'USD')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={currencyOpts} showSearch optionFilterProp="label" placeholder="Select currency" />
            </Form.Item>
            <Form.Item name="uomId" label={hint('Unit of Measure', 'Quantity unit for the published price. Oil: BBL or MT. Gas: MMBTU. Power: MWH. Metals: MT or TROY_OZ.', 'BBL')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={uomOpts} showSearch optionFilterProp="label" placeholder="Select UoM" />
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
          <Form.Item name="marketProductLinkId" label={hint('Listing', 'Primary market/product listing this index is quick-picked from in pricing formulas. Optional — an index sourced from multiple listings (e.g. Dated Brent via both ICE Brent futures and OTC cargoes) keeps its full sourcing map on Price Index Sources; this is just the default one.')}>
            <Select allowClear showSearch optionFilterProp="label" options={listingOpts} placeholder="Select listing" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
