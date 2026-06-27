import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch, Divider, Typography } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useProducts, useSaveProduct, useDeactivateProduct } from './hooks';
import { SETTLEMENT_TYPES, type Product, type ProductInput, type SettlementType } from './types';
import { COMMODITY_TYPES, type CommodityType } from '@features/organization/desks/types';

const SETTLE_COLOR: Record<SettlementType, string> = {
  PHYSICAL: 'blue', FINANCIAL: 'purple', OPTIONS: 'orange', SWAP: 'cyan',
};
const COMMODITY_COLOR: Record<CommodityType, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
};

const UOM_OPTIONS = ['BBL', 'MT', 'KBD', 'MWH', 'GWH', 'MW', 'MMBTU', 'MCM', 'THERM', 'BUSHEL', 'KG', 'TROY_OZ'];
const PRICING_TYPE_OPTIONS = ['FLAT', 'INDEX', 'DIFFERENTIAL', 'FORMULA', 'FLOATING', 'TBN'];

export function ProductsPage() {
  const { data, isLoading, refetch } = useProducts();
  const save = useSaveProduct();
  const deactivate = useDeactivateProduct();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [activeCommodity, setActiveCommodity] = useState<'ALL' | CommodityType>('ALL');
  const [form] = Form.useForm<ProductInput>();

  const filtered = useMemo(
    () => (data ?? []).filter((p) => activeCommodity === 'ALL' || p.commodityType === activeCommodity),
    [data, activeCommodity],
  );

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(p: Product) { setEditing(p); form.setFieldsValue({ productCode: p.productCode, productName: p.productName, commodityId: p.commodityId, commodityType: p.commodityType, settlementType: p.settlementType, defaultPricingTypeCode: p.defaultPricingTypeCode, defaultUomCode: p.defaultUomCode, lotSize: p.lotSize, minQuantity: p.minQuantity, maxQuantity: p.maxQuantity, isActive: p.isActive }); setOpen(true); }
  async function submit() { const v = await form.validateFields(); await save.mutateAsync({ id: editing?.productId ?? null, input: v }); setOpen(false); }

  const colDefs = useMemo<ColDef<Product>[]>(() => [
    { field: 'productCode', headerName: 'Code', cellClass: 'cell-mono', width: 160, pinned: 'left',
      tooltipValueGetter: () => 'Unique product code used in trade capture and position buckets' },
    { field: 'productName', headerName: 'Product', flex: 1.4, minWidth: 200 },
    {
      field: 'commodityType', headerName: 'Commodity', width: 120,
      cellRenderer: (p: { value: CommodityType }) => <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      field: 'settlementType', headerName: 'Settlement', width: 120,
      tooltipValueGetter: () => 'PHYSICAL = actual delivery of commodity; FINANCIAL = cash-settled against index; OPTIONS = right but not obligation; SWAP = exchange of cash flows',
      cellRenderer: (p: { value: SettlementType }) => <Tag color={SETTLE_COLOR[p.value]}>{p.value}</Tag>,
    },
    { field: 'defaultPricingTypeCode', headerName: 'Pricing Type', width: 130,
      tooltipValueGetter: () => 'Default pricing mechanism — can be overridden at deal level' },
    { field: 'defaultUomCode', headerName: 'UoM', width: 90, cellClass: 'cell-mono',
      tooltipValueGetter: () => 'Unit of measure for quantity — BBL (barrels), MT (metric tons), MWh (megawatt-hours), etc.' },
    {
      field: 'lotSize', headerName: 'Lot Size', width: 110, cellClass: 'cell-mono',
      tooltipValueGetter: () => 'Minimum tradeable unit. Exchange products have fixed lot sizes (e.g. NYMEX WTI = 1,000 BBL). OTC products can be any size.',
      valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '—',
    },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Product }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate product?" description="Existing trades referencing this product are unaffected." onConfirm={() => deactivate.mutate(p.data.productId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Products" description="Tradeable products — each product defines the commodity, settlement type, default pricing, and quantity constraints used in deal capture." moduleGroup="markets" />
      <SmartGrid columnDefs={colDefs} rowData={filtered} loading={isLoading}
        onAdd={openNew} addLabel="New Product"
        commodityFilter activeCommodity={activeCommodity} onCommodityChange={(c) => setActiveCommodity(c as 'ALL' | CommodityType)}
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.productId)} />

      <Drawer title={editing ? `Edit Product — ${editing.productCode}` : 'New Product'} open={open} onClose={() => setOpen(false)} width={540}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={submit} loading={save.isPending}>Save</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="productCode" label={hint('Product Code', 'Unique identifier used across deal capture, position buckets, and risk attribution. Convention: COMMODITY-GRADE or COMMODITY-PRODUCT. Once set and referenced in trades, cannot be changed.', 'OIL-DATED-BRENT', 'COMMODITY-DESCRIPTOR')} rules={[{ required: true }]}>
            <Input placeholder="OIL-DATED-BRENT" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="productName" label={hint('Product Name', 'Human-readable name as it appears in trade confirmations, reports, and invoices.', 'Dated Brent Crude')} rules={[{ required: true }]}>
            <Input placeholder="Dated Brent Crude" />
          </Form.Item>
          <Form.Item name="commodityType" label={hint('Commodity Type', 'Top-level commodity classification. Drives which extension tables, pricing indices, and delivery workflows apply. Cannot be changed after trades are booked.', 'OIL')} rules={[{ required: true }]}>
            <Select options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))} placeholder="Select commodity" />
          </Form.Item>
          <Form.Item name="commodityId" label={hint('Commodity (ID)', 'References the commodity master record for this product type.', '1 (OIL)')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Commodity ID" />
          </Form.Item>
          <Form.Item name="settlementType" label={hint('Settlement Type', 'PHYSICAL: actual delivery of the commodity on settlement date.\nFINANCIAL: no delivery — cash difference settled against a price index.\nOPTIONS: buyer has right but not obligation to deliver/receive.\nSWAP: exchange of fixed vs. floating cash flows.', 'PHYSICAL')} rules={[{ required: true }]}>
            <Select options={SETTLEMENT_TYPES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>Pricing & Quantity Defaults</Typography.Text></Divider>
          <Form.Item name="defaultPricingTypeCode" label={hint('Default Pricing Type', 'Pricing mechanism defaulted at deal capture — always overridable per trade.\nINDEX: price = benchmark index ± differential.\nFLAT: fixed price agreed at trade date.\nFORMULA: multi-component formula (e.g. Oman+Dubai÷2).\nTBN: to be nominated — price fixed later.', 'INDEX')} rules={[{ required: true }]}>
            <Select options={PRICING_TYPE_OPTIONS.map((p) => ({ label: p, value: p }))} />
          </Form.Item>
          <Form.Item name="defaultUomCode" label={hint('Default Unit of Measure', 'Quantity unit for this product. Oil: BBL or MT. Gas: MMBTU or MCM. Power: MWH or GWH. Metals: MT or TROY_OZ. Grains: BUSHEL.', 'BBL (Barrels)')} rules={[{ required: true }]}>
            <Select options={UOM_OPTIONS.map((u) => ({ label: u, value: u }))} showSearch />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="lotSize" label={hint('Lot Size', 'Minimum tradeable unit. Exchange contracts have fixed lots (NYMEX WTI = 1,000 BBL, LME Copper = 25 MT). OTC products typically have no lot constraint — leave blank.', '1000 (NYMEX WTI standard lot)')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="e.g. 1000" formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="minQuantity" label={hint('Min Quantity', 'Minimum deal size in the default UoM. Prevents micro-trades that generate disproportionate settlement costs.', '500')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="e.g. 500" />
            </Form.Item>
            <Form.Item name="maxQuantity" label={hint('Max Quantity', 'Maximum single-trade size. Triggers a compliance alert if a trader attempts to book above this — does not block the trade, routes to senior approval.', '5000000')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="e.g. 5000000" />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
