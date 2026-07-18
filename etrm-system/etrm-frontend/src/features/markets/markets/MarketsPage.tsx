import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch,
  InputNumber, Tabs, Table, Tooltip, Badge,
} from 'antd';
import { EditOutlined, StopOutlined, LinkOutlined, PlusOutlined, CalendarOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import {
  useMarkets, useSaveMarket, useDeactivateMarket,
  useMarketProducts, useSaveMarketProduct,
  useMarketProductPeriods, useAddPeriodToMarketProduct,
  useMarketProductSources,
} from './hooks';
import { MARKET_TYPES, SETTLEMENT_TYPES_MKT, type Market, type MarketInput, type MarketProduct, type MarketType, type SettlementTypeMkt } from './types';
import { COMMODITY_TYPES } from '@features/organization/desks/types';
import { useProducts } from '@features/markets/products/hooks';
import { useFormDraft } from '@components/smart/formDraft';
import { useCountries } from '@features/reference/countries/hooks';
import { useExchanges } from '@features/markets/exchanges/hooks';

const MKT_TYPE_COLOR: Record<MarketType, string> = {
  EXCHANGE: 'blue', OTC_CLEARED: 'cyan', OTC_BILATERAL: 'orange', OTC_PHYSICAL: 'green', BROKER: 'purple', INTERNAL: 'default',
};
const SETTLE_COLOR: Record<SettlementTypeMkt, string> = {
  PHYSICAL: 'green', FINANCIAL: 'purple', BOTH: 'geekblue',
};
const ROLE_COLOR: Record<string, string> = {
  PRIMARY_MTM: 'blue', SETTLEMENT: 'green', BACKUP: 'orange', REFERENCE: 'default',
};

// ─── Market-Product detail drawer ─────────────────────────────────────────────
function MarketProductDetail({ mp, onClose }: { mp: MarketProduct; onClose: () => void }) {
  const [addPeriodOpen, setAddPeriodOpen] = useState(false);
  const { data: periods, isLoading: periodsLoading } = useMarketProductPeriods(mp.marketProductId);
  const { data: sources, isLoading: sourcesLoading } = useMarketProductSources(mp.marketProductId);
  const addPeriod = useAddPeriodToMarketProduct(mp.marketProductId);

  return (
    <Drawer mask={false} forceRender
      title={<Space><Tag color="blue">{mp.productCode}</Tag>{mp.productName} on this market</Space>}
      open onClose={onClose} width={620}
    >
      <Tabs defaultActiveKey="periods" items={[
        {
          key: 'periods',
          label: <Space><CalendarOutlined />Trading Periods<Badge count={periods?.length ?? 0} showZero size="small" /></Space>,
          children: (
            <>
              <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#888' }}>Periods valid for this product on this market — controls what a trader can select in deal capture</span>
                <Button size="small" icon={<PlusOutlined />} onClick={() => setAddPeriodOpen(true)}>Link Period</Button>
              </div>
              <Table
                dataSource={periods}
                rowKey="mppId"
                pagination={false}
                size="small"
                loading={periodsLoading}
                columns={[
                  { title: 'Period Code', dataIndex: 'periodCode', width: 130, render: (v: string) => <code style={{ fontFamily: 'monospace' }}>{v}</code> },
                  { title: 'Period Name', dataIndex: 'periodName', width: 200 },
                  { title: 'Type', dataIndex: 'periodType', width: 90, render: (v: string) => <Tag>{v}</Tag> },
                  { title: 'Curve Label', dataIndex: 'curveLabel', width: 100, render: (v: string | null) => v ? <Tag color="cyan">{v}</Tag> : '—' },
                  { title: 'Active', dataIndex: 'isActive', width: 70, render: (v: boolean) => <ActiveTag active={v} /> },
                ]}
              />
              {addPeriodOpen && (
                <div style={{ marginTop: 16, padding: 12, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                  <Form layout="inline" onFinish={(v: { periodId: number }) => { addPeriod.mutate(v.periodId); setAddPeriodOpen(false); }}>
                    <Form.Item name="periodId" label={hint('Period ID', 'Contract-month/delivery-period identifier per the venue\'s ID convention — not a free-text label.')} rules={[{ required: true }]}>
                      <InputNumber placeholder="Period ID" />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={addPeriod.isPending} size="small">Link</Button>
                      <Button size="small" style={{ marginLeft: 8 }} onClick={() => setAddPeriodOpen(false)}>Cancel</Button>
                    </Form.Item>
                  </Form>
                </div>
              )}
            </>
          ),
        },
        {
          key: 'sources',
          label: <Space><DollarOutlined />Price Sources<Badge count={sources?.length ?? 0} showZero size="small" /></Space>,
          children: (
            <>
              <div style={{ marginBottom: 12, fontSize: 12, color: '#888' }}>
                Price data feeds for {mp.productCode} on this market — PRIMARY_MTM is used for daily mark-to-market, SETTLEMENT for contract expiry
              </div>
              <Table
                dataSource={sources}
                rowKey="mpsId"
                pagination={false}
                size="small"
                loading={sourcesLoading}
                columns={[
                  { title: 'Source', dataIndex: 'sourceCode', width: 120, render: (v: string) => <Tag>{v}</Tag> },
                  { title: 'Source Name', dataIndex: 'sourceName', width: 180 },
                  { title: 'Role', dataIndex: 'sourceRole', width: 130,
                    render: (v: string) => <Tag color={ROLE_COLOR[v] ?? 'default'}>{v.replace('_', ' ')}</Tag> },
                  { title: 'Field / Ticker', dataIndex: 'sourceTicker', width: 140,
                    render: (_: unknown, r: { sourceTicker: string | null; sourceFieldCode: string | null }) =>
                      r.sourceTicker ?? r.sourceFieldCode ?? <span style={{ color: '#888' }}>—</span> },
                  { title: 'Eff. From', dataIndex: 'effectiveFrom', width: 100,
                    render: (v: string) => dayjs(v).format('DD MMM YY') },
                  { title: 'Active', dataIndex: 'isActive', width: 70, render: (v: boolean) => <ActiveTag active={v} /> },
                ]}
              />
            </>
          ),
        },
        {
          key: 'specs',
          label: 'Market Specs',
          children: (
            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
              {([
                ['Product Code', mp.productCode],
                ['Exchange Ticker', mp.ticker ?? '—'],
                ['Currency Override', mp.currencyCode ?? 'Market default'],
                ['UoM Override', mp.uomCode ?? 'Product default'],
                ['Lot Size', mp.lotSize?.toLocaleString() ?? 'Product default'],
                ['Min Quantity', mp.minQuantity?.toLocaleString() ?? '—'],
                ['Max Quantity', mp.maxQuantity?.toLocaleString() ?? '—'],
                ['Price Precision (dp)', mp.pricePrecision?.toString() ?? '—'],
                ['Settlement Type Override', mp.settlementType ?? 'Product default'],
                ['First Notice Day Offset', mp.firstNoticeDayOffset != null ? `${mp.firstNoticeDayOffset} days before expiry` : '—'],
                ['Last Trading Day Offset', mp.lastTradingDayOffset != null ? `${mp.lastTradingDayOffset} days before delivery month end` : '—'],
                ['Listed Date', mp.listedDate ? dayjs(mp.listedDate).format('DD MMM YYYY') : '—'],
              ] as [string, string][]).map(([label, value]) => (
                <tr key={label} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '6px 0', color: '#888', width: 220 }}>{label}</td>
                  <td style={{ padding: '6px 0', fontFamily: value === '—' ? undefined : 'monospace' }}>{value}</td>
                </tr>
              ))}
            </table>
          ),
        },
      ]} />
    </Drawer>
  );
}

// ─── Market Products sub-drawer ───────────────────────────────────────────────
function MarketProductsDrawer({ market, onClose }: { market: Market; onClose: () => void }) {
  const { data: mps, isLoading } = useMarketProducts(market.marketId);
  const save = useSaveMarketProduct(market.marketId);
  const { data: products = [] } = useProducts();
  const productOpts = (products as { productId: number; productCode: string; productName: string }[])
    .map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` }));
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMp, setSelectedMp] = useState<MarketProduct | null>(null);
  const [form] = Form.useForm();

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    await save.mutateAsync({ id: null, input: { ...v, marketId: market.marketId } });
    if (closeAfter) setAddOpen(false);
    form.resetFields();
  }

  return (
    <>
      <Drawer mask={false} forceRender
        title={<Space><Tag color="blue">{market.marketCode}</Tag>Products & Periods & Sources</Space>}
        open onClose={onClose} width={760}
        extra={<Button icon={<PlusOutlined />} type="primary" size="small" onClick={() => setAddOpen(true)}>Link Product</Button>}
      >
        <div style={{ marginBottom: 12, fontSize: 12, color: '#888' }}>
          Products listed on {market.marketName}. Click a product to view its valid trading periods and price sources.
        </div>
        <Table
          dataSource={mps}
          rowKey="marketProductId"
          pagination={false}
          size="small"
          loading={isLoading}
          columns={[
            { title: 'Product', dataIndex: 'productCode', width: 140,
              render: (v: string, r: MarketProduct) => <Tooltip title={r.productName}><Tag color="blue">{v}</Tag></Tooltip> },
            { title: 'Ticker', dataIndex: 'ticker', width: 100, render: (v: string | null) => v ? <code style={{ fontFamily: 'monospace' }}>{v}</code> : '—' },
            { title: 'CCY', dataIndex: 'currencyCode', width: 70, render: (v: string | null) => v ?? <span style={{ color: '#888' }}>Default</span> },
            { title: 'Lot Size', dataIndex: 'lotSize', width: 90, render: (v: number | null) => v != null ? v.toLocaleString() : '—' },
            { title: 'LTD Offset', dataIndex: 'lastTradingDayOffset', width: 100,
              render: (v: number | null) => v != null ? <Tooltip title="Days before delivery month end">{v}d</Tooltip> : '—' },
            { title: 'Active', dataIndex: 'isActive', width: 80, render: (v: boolean) => <ActiveTag active={v} /> },
            {
              title: '', width: 80,
              render: (_: unknown, r: MarketProduct) => (
                <Button size="small" type="link" icon={<LinkOutlined />} onClick={() => setSelectedMp(r)}>Detail</Button>
              ),
            },
          ]}
        />

        {addOpen && (
          <div style={{ marginTop: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
            <Form form={form} layout="vertical">
              <Space style={{ width: '100%', gap: 12 }}>
                <Form.Item name="productId" label={hint('Product', 'The product being listed on this market. Market-specific attributes below (ticker, lot size) override the product defaults.')} rules={[{ required: true }]} style={{ flex: 1 }}>
                  <Select options={productOpts} placeholder="Select product" showSearch allowClear
                    filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
                </Form.Item>
                <Form.Item name="ticker" label={hint('Exchange Ticker', 'Exchange-specific contract code used in order routing and FIX messaging. ICE Brent: B, NYMEX WTI: CL, LME Copper: CA.', 'B, CL, CA')} style={{ flex: 1 }}>
                  <Input placeholder="CL" style={{ fontFamily: 'monospace' }} />
                </Form.Item>
                <Form.Item name="lotSize" label="Lot Size" style={{ flex: 1 }}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
              </Space>
              <Space style={{ width: '100%', gap: 12 }}>
                <Form.Item name="lastTradingDayOffset" label={hint('Last Trading Day Offset', 'Number of calendar days before the end of the delivery month when trading ceases. NYMEX WTI: 3 business days before 25th of month. ICE Brent: trading stops before delivery month starts.')} style={{ flex: 1 }}>
                  <InputNumber style={{ width: '100%' }} placeholder="-3" />
                </Form.Item>
                <Form.Item name="firstNoticeDayOffset" label={hint('First Notice Day Offset', 'Days before contract expiry when physical delivery notices can be issued. Relevant for physical delivery contracts — triggers operational workflow.')} style={{ flex: 1 }}>
                  <InputNumber style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="pricePrecision" label="Price Precision" style={{ flex: 1 }}>
                  <InputNumber style={{ width: '100%' }} placeholder="2" min={0} max={8} />
                </Form.Item>
              </Space>
              <Space>
                <Button onClick={() => { void submit(false); }} loading={save.isPending} size="small">Add & Next</Button>
                <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending} size="small">Add & Close</Button>
                <Button size="small" onClick={() => { setAddOpen(false); form.resetFields(); }}>Cancel</Button>
              </Space>
            </Form>
          </div>
        )}
      </Drawer>

      {selectedMp && <MarketProductDetail mp={selectedMp} onClose={() => setSelectedMp(null)} />}
    </>
  );
}

// ─── Main Markets Page ─────────────────────────────────────────────────────────
export function MarketsPage() {
  const { data, isLoading, refetch } = useMarkets();
  const save = useSaveMarket();
  const deactivate = useDeactivateMarket();
  const { data: countries = [] } = useCountries();
  const countryOptions = countries.map((c) => ({ value: c.countryId, label: `${c.countryCode} — ${c.countryName}` }));
  const { data: exchanges = [] } = useExchanges();
  const exchangeOptions = exchanges.map((e) => ({ value: e.exchangeId, label: `${e.exchangeCode} — ${e.exchangeName}` }));
  const [editOpen, setEditOpen] = useState(false);
  const [detailMarket, setDetailMarket] = useState<Market | null>(null);
  const [editing, setEditing] = useState<Market | null>(null);
  const [form] = Form.useForm<MarketInput>();
  useFormDraft('markets-markets', { form, open: editOpen, setOpen: setEditOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ isActive: true, settlementType: 'FINANCIAL', marketType: 'EXCHANGE' }); setEditOpen(true); }
  function openEdit(m: Market) {
    setEditing(m);
    form.setFieldsValue({
      exchangeId: m.exchangeId, commodityType: m.commodityType, marketCode: m.marketCode,
      marketName: m.marketName, marketType: m.marketType, settlementType: m.settlementType,
      currencyCode: m.currencyCode, timezone: m.timezone, countryId: m.countryId ?? undefined,
      clearingHouse: m.clearingHouse ?? undefined, contractSize: m.contractSize,
      contractUomCode: m.contractUomCode ?? undefined, priceQuotation: m.priceQuotation ?? undefined,
      tickSize: m.tickSize, isActive: m.isActive,
    });
    setEditOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.marketId ?? null, input: v });
    if (closeAfter) setEditOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Market>[]>(() => [
    { field: 'marketCode', headerName: 'Market Code', cellClass: 'cell-mono', width: 160, pinned: 'left',
      tooltipValueGetter: () => 'Unique market identifier used in trade capture to identify the venue/market for a deal' },
    { field: 'marketName', headerName: 'Market', flex: 1.5, minWidth: 220 },
    { field: 'exchangeCode', headerName: 'Exchange', width: 100, cellClass: 'cell-mono',
      valueFormatter: (p) => p.value ?? 'OTC',
      cellRenderer: (p: { value: string | null }) => p.value ? <Tag color="blue">{p.value}</Tag> : <Tag color="orange">OTC</Tag> },
    { field: 'commodityType', headerName: 'Commodity', width: 120, cellRenderer: (p: { value: string }) => <Tag>{p.value}</Tag> },
    { field: 'marketType', headerName: 'Type', width: 130, cellRenderer: (p: { value: MarketType }) => <Tag color={MKT_TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace('_', ' ')}</Tag> },
    { field: 'settlementType', headerName: 'Settlement', width: 110, cellRenderer: (p: { value: SettlementTypeMkt }) => <Tag color={SETTLE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'currencyCode', headerName: 'CCY', width: 75, cellClass: 'cell-mono' },
    { field: 'clearingHouse', headerName: 'Clearing House', width: 140, valueFormatter: (p) => p.value ?? 'Bilateral' },
    { field: 'tickSize', headerName: 'Tick', width: 80, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Minimum price movement — determines P&L sensitivity per tick' },
    { field: 'priceQuotation', headerName: 'Quotation', flex: 1, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 120, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Market }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<LinkOutlined />} onClick={() => setDetailMarket(p.data)} title="Products & Periods & Sources" />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate market?" onConfirm={() => deactivate.mutate(p.data.marketId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Markets"
        description="Trading markets — exchange-listed and OTC. Each market links to an exchange, commodity, clearing house, and its listed products with valid trading periods and price sources."
        moduleGroup="markets"
      />
      <SmartGrid
        columnDefs={colDefs} rowData={data} loading={isLoading}
        onAdd={openNew} addLabel="New Market"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.marketId)}
        commodityFilter
      />

      {/* Market detail: products + periods + sources */}
      {detailMarket && <MarketProductsDrawer market={detailMarket} onClose={() => setDetailMarket(null)} />}

      {/* Create / Edit market form */}
      <Drawer mask={false} forceRender
        title={editing ? `Edit Market — ${editing.marketCode}` : 'New Market'}
        open={editOpen} onClose={() => setEditOpen(false)} width={560}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="marketCode" label={hint('Market Code', 'Unique market identifier. Convention: {EXCHANGE}_{PRODUCT} for exchange markets, OTC_{COMMODITY}_{TYPE} for OTC. Examples: ICE_BRENT (ICE Brent Futures), NYMEX_WTI (NYMEX WTI Crude), OTC_NS_CRUDE (North Sea OTC physical crude).', 'ICE_BRENT, NYMEX_WTI, OTC_NS_CRUDE')} rules={[{ required: true }]}>
            <Input placeholder="ICE_BRENT" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="marketName" label="Market Name" rules={[{ required: true }]}>
            <Input placeholder="ICE Brent Crude Futures" />
          </Form.Item>
          <Form.Item name="commodityType" label={hint('Commodity', 'Commodity underpinning this market — drives which products can be listed and which period conventions apply.')} rules={[{ required: true }]}>
            <Select options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="marketType" label={hint('Market Type', 'EXCHANGE: regulated, cleared on an exchange. OTC_CLEARED: bilaterally traded but cleared through a CCP (e.g. LCH). OTC_BILATERAL: full counterparty credit risk, no CCP. BROKER: voice or screen broker intermediated.', 'EXCHANGE')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={MARKET_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
            </Form.Item>
            <Form.Item name="settlementType" label={hint('Settlement', 'PHYSICAL: actual delivery of commodity. FINANCIAL: cash settlement against index. BOTH: contract can go either way depending on option at expiry.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={SETTLEMENT_TYPES_MKT.map((s) => ({ label: s, value: s }))} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="exchangeId" label={hint('Exchange', 'Optional — link to Exchange master data. Leave blank for OTC/bilateral markets with no formal exchange listing.')} style={{ flex: 1 }}>
              <Select allowClear showSearch optionFilterProp="label" options={exchangeOptions} placeholder="Select exchange" />
            </Form.Item>
            <Form.Item name="currencyCode" label={hint('Currency', 'Market quoting currency. Most crude oil markets: USD. European gas/power: EUR. UK gas: GBP. LME base metals: USD.', 'USD, EUR, GBP')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="countryId" label="Country" style={{ flex: 1 }}>
              <Select options={countryOptions} showSearch optionFilterProp="label" allowClear placeholder="Select country" />
            </Form.Item>
          </Space>
          <Form.Item name="timezone" label={hint('Timezone', 'IANA timezone for market hours, session open/close, and last trading day calculations.', 'Europe/London, America/New_York, Asia/Singapore')} rules={[{ required: true }]}>
            <Input placeholder="Europe/London" />
          </Form.Item>
          <Form.Item name="clearingHouse" label={hint('Clearing House (CCP)', 'Central counterparty that clears trades on this market. Required for EXCHANGE and OTC_CLEARED. Absent for OTC_BILATERAL where both parties bear full counterparty credit risk.', 'ICE Clear Europe, LCH, CME Clearing')}>
            <Input placeholder="ICE Clear Europe" />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="contractSize" label={hint('Contract Size', 'Standard lot size for exchange contracts. NYMEX WTI: 1,000 BBL. ICE Brent: 1,000 BBL. LME Copper: 25 MT. EEX Power: 1 MW/h.', '1000')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="1000" />
            </Form.Item>
            <Form.Item name="contractUomCode" label="Contract UoM" style={{ flex: 1 }}>
              <Input placeholder="BBL" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="tickSize" label={hint('Tick Size', 'Minimum price movement. NYMEX WTI: $0.01/BBL. LME Copper: $0.50/MT. Power: €0.01/MWh. Determines minimum P&L step.', '0.01')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="0.01" step={0.01} />
            </Form.Item>
          </Space>
          <Form.Item name="priceQuotation" label={hint('Price Quotation', 'How prices are quoted — used for display and confirmations.', 'USD per barrel, EUR per MWh, USD per metric tonne')}>
            <Input placeholder="USD per barrel" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
