import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch,
  InputNumber, Tabs, Table, Tooltip, Badge,
} from 'antd';
import { EditOutlined, StopOutlined, LinkOutlined, PlusOutlined, DollarOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import {
  useMarkets, useSaveMarket, useDeactivateMarket,
  useMarketProductLinks, useSaveMarketProductLink,
  useMarketProductSources,
} from './hooks';
import { MARKET_TYPES, SETTLEMENT_TYPES_MKT, type Market, type MarketInput, type MarketProductLink, type MarketType, type SettlementTypeMkt } from './types';
import { COMMODITY_TYPES, type CommodityType } from '@features/reference/commodity-types/types';
import { useProducts } from '@features/markets/products/hooks';
import { useFormDraft } from '@components/smart/formDraft';
import { useExchanges } from '@features/markets/exchanges/hooks';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { color } from '@theme/tokens';

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
function MarketProductDetail({ mp, onClose }: { mp: MarketProductLink; onClose: () => void }) {
  const { data: sources, isLoading: sourcesLoading } = useMarketProductSources(mp.marketProductLinkId);

  return (
    <Drawer mask={false} forceRender
      title={<Space><Tag color="blue">{mp.productCode}</Tag>{mp.productName} on this market</Space>}
      open onClose={onClose} width={620}
    >
      <Tabs defaultActiveKey="sources" items={[
        {
          key: 'sources',
          label: <Space><DollarOutlined />Price Sources<Badge count={sources?.length ?? 0} showZero size="small" /></Space>,
          children: (
            <>
              <div style={{ marginBottom: 12, fontSize: 12, color: color.textSecondary }}>
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
                      r.sourceTicker ?? r.sourceFieldCode ?? <span style={{ color: color.textSecondary }}>—</span> },
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
                ['First Notice Day Offset', mp.firstNoticeDayOffset != null ? `${mp.firstNoticeDayOffset} days before expiry` : '—'],
                ['Last Trading Day Offset', mp.lastTradingDayOffset != null ? `${mp.lastTradingDayOffset} days before delivery month end` : '—'],
              ] as [string, string][]).map(([label, value]) => (
                <tr key={label} style={{ borderBottom: `1px solid ${color.border}` }}>
                  <td style={{ padding: '6px 0', color: color.textSecondary, width: 220 }}>{label}</td>
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
  const { data: mps, isLoading } = useMarketProductLinks(market.marketId);
  const save = useSaveMarketProductLink(market.marketId);
  const { data: products = [] } = useProducts();
  const productOpts = (products as { productId: number; productCode: string; productName: string }[])
    .map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` }));
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMp, setSelectedMp] = useState<MarketProductLink | null>(null);
  const [editingMp, setEditingMp] = useState<MarketProductLink | null>(null);
  const [form] = Form.useForm();

  function openAdd() {
    setEditingMp(null);
    form.resetFields();
    setAddOpen(true);
  }

  function openEditMp(mp: MarketProductLink) {
    setEditingMp(mp);
    form.setFieldsValue(mp);
    setAddOpen(true);
  }

  function closeForm() {
    setAddOpen(false);
    setEditingMp(null);
    form.resetFields();
  }

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    // The form only has Form.Items for a subset of MarketProductLinkInput's
    // fields — validateFields() returns just those, so on edit the rest
    // (isActive, currencyId, uomId, minQuantity, maxQuantity, notes) must be
    // carried over from the existing row explicitly, or they'd silently fall
    // back to MarketProductLink.java's field initializers (isActive=true)
    // and e.g. reactivate a deactivated link.
    const preserved = editingMp
      ? {
          currencyId: editingMp.currencyId, uomId: editingMp.uomId,
          minQuantity: editingMp.minQuantity, maxQuantity: editingMp.maxQuantity,
          notes: editingMp.notes,
          isActive: editingMp.isActive,
        }
      : { isActive: true };
    await save.mutateAsync({
      id: editingMp?.marketProductLinkId ?? null,
      input: { ...preserved, ...v, marketId: market.marketId, rowVersion: editingMp?.rowVersion ?? 0 },
    });
    if (closeAfter || editingMp) closeForm();
    else form.resetFields();
  }

  return (
    <>
      <Drawer mask={false} forceRender
        title={<Space><Tag color="blue">{market.marketCode}</Tag>Products & Periods & Sources</Space>}
        open onClose={onClose} width={760}
        extra={<Button icon={<PlusOutlined />} type="primary" size="small" onClick={openAdd}>Link Product</Button>}
      >
        <div style={{ marginBottom: 12, fontSize: 12, color: color.textSecondary }}>
          Products listed on {market.marketName}. Click a product to view its valid trading periods and price sources.
        </div>
        <Table
          dataSource={mps}
          rowKey="marketProductLinkId"
          pagination={false}
          size="small"
          loading={isLoading}
          columns={[
            { title: 'Product', dataIndex: 'productCode', width: 140,
              render: (v: string, r: MarketProductLink) => <Tooltip title={r.productName}><Tag color="blue">{v}</Tag></Tooltip> },
            { title: 'Ticker', dataIndex: 'ticker', width: 100, render: (v: string | null) => v ? <code style={{ fontFamily: 'monospace' }}>{v}</code> : '—' },
            { title: 'CCY', dataIndex: 'currencyCode', width: 70, render: (v: string | null) => v ?? <span style={{ color: color.textSecondary }}>Default</span> },
            { title: 'Lot Size', dataIndex: 'lotSize', width: 90, render: (v: number | null) => v != null ? v.toLocaleString() : '—' },
            { title: 'LTD Offset', dataIndex: 'lastTradingDayOffset', width: 100,
              render: (v: number | null) => v != null ? <Tooltip title="Days before delivery month end">{v}d</Tooltip> : '—' },
            { title: 'Active', dataIndex: 'isActive', width: 80, render: (v: boolean) => <ActiveTag active={v} /> },
            {
              title: '', width: 130,
              render: (_: unknown, r: MarketProductLink) => (
                <Space size={4}>
                  <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEditMp(r)} />
                  <Button size="small" type="link" icon={<LinkOutlined />} onClick={() => setSelectedMp(r)}>Detail</Button>
                </Space>
              ),
            },
          ]}
        />

        {addOpen && (
          <div style={{ marginTop: 16, padding: 16, border: `1px solid ${color.border}`, borderRadius: 6 }}>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{editingMp ? `Editing ${editingMp.productCode}` : 'Link a new product'}</div>
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
                {editingMp ? (
                  <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending} size="small">Save</Button>
                ) : (
                  <>
                    <Button onClick={() => { void submit(false); }} loading={save.isPending} size="small">Add & Next</Button>
                    <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending} size="small">Add & Close</Button>
                  </>
                )}
                <Button size="small" onClick={closeForm}>Cancel</Button>
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
  const { data: exchanges = [] } = useExchanges();
  const exchangeOptions = exchanges.map((e) => ({ value: e.exchangeId, label: `${e.exchangeCode} — ${e.exchangeName}` }));
  // V165 — clearing_house went from free-text to an FK into dbo.counterparty
  // (new CLEARING_HOUSE counterparty_type) — resolve the type id by label
  // rather than hardcoding it, since it's assigned by IDENTITY at migration time.
  const { data: cpTypeOptions = [] } = useCustomConfigOptions('COUNTERPARTY_TYPE');
  const { data: counterparties = [] } = useCounterparties();
  const clearingHouseTypeId = cpTypeOptions.find((o) => o.label === 'Clearing House (CCP)')?.value;
  const clearingHouseOptions = counterparties
    .filter((c) => c.cpType === clearingHouseTypeId)
    .map((c) => ({ value: c.counterpartyId, label: c.legalName }));
  const [editOpen, setEditOpen] = useState(false);
  const [detailMarket, setDetailMarket] = useState<Market | null>(null);
  const [editing, setEditing] = useState<Market | null>(null);
  const [activeCommodity, setActiveCommodity] = useState<'ALL' | CommodityType>('ALL');
  const [form] = Form.useForm<MarketInput>();
  useFormDraft('markets-markets', { form, open: editOpen, setOpen: setEditOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ isActive: true, settlementType: 'FINANCIAL', marketType: 'EXCHANGE' }); setEditOpen(true); }
  function openEdit(m: Market) {
    setEditing(m);
    form.setFieldsValue({
      exchangeId: m.exchangeId, commodityType: m.commodityType, marketCode: m.marketCode,
      marketName: m.marketName, marketType: m.marketType, settlementType: m.settlementType,
      timezone: m.timezone ?? undefined,
      clearingHouseId: m.clearingHouseId ?? undefined,
      isActive: m.isActive,
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
    { field: 'clearingHouseName', headerName: 'Clearing House', width: 160, valueFormatter: (p) => p.value ?? 'Bilateral' },
    { field: 'timezone', headerName: 'Timezone', width: 160, valueFormatter: (p) => p.value ?? '—' },
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

  const filteredMarkets = useMemo(
    () => (data ?? []).filter((m) => activeCommodity === 'ALL' || m.commodityType === activeCommodity),
    [data, activeCommodity],
  );

  return (
    <>
      <PageHeader
        title="Markets"
        description="Trading markets — exchange-listed and OTC. Each market links to an exchange, commodity, clearing house, and its listed products with valid trading periods and price sources."
        moduleGroup="markets"
      />
      <SmartGrid
        columnDefs={colDefs} rowData={filteredMarkets} loading={isLoading}
        onAdd={openNew} addLabel="New Market"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.marketId)}
        commodityFilter
        activeCommodity={activeCommodity}
        onCommodityChange={(c) => setActiveCommodity(c as 'ALL' | CommodityType)}
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
          <Form.Item name="exchangeId" label={hint('Exchange', 'Optional — link to Exchange master data. Leave blank for OTC/bilateral markets with no formal exchange listing.')}>
            <Select allowClear showSearch optionFilterProp="label" options={exchangeOptions} placeholder="Select exchange" />
          </Form.Item>
          <Form.Item name="timezone" label={hint('Timezone', 'IANA timezone for market hours, session open/close, and last trading day calculations — optional, leave blank for global/index-based markets with no single meaningful timezone.', 'Europe/London, America/New_York, Asia/Singapore')}>
            <Input placeholder="Europe/London" />
          </Form.Item>
          <Form.Item name="clearingHouseId" label={hint('Clearing House (CCP)', 'Central counterparty that clears trades on this market. Required for EXCHANGE and OTC_CLEARED. Absent for OTC_BILATERAL where both parties bear full counterparty credit risk. Modeled as a Counterparty (Clearing House type) — register one there first if it\'s missing here.', 'ICE Clear Europe, LCH, CME Clearing')}>
            <Select allowClear showSearch optionFilterProp="label" options={clearingHouseOptions} placeholder="Select clearing house" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
