import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select,
  InputNumber, Divider, Typography, Row, Col, Segmented, Card,
  Tooltip,
} from 'antd';
import {
  EditOutlined, StopOutlined, CheckCircleOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useTrades, useSaveTrade, useCancelTrade, useConfirmTrade, useCounterparties, useLegalEntities, useIncoterms } from './hooks';
import type { Trade, TradeInput, CommodityTypeTrade } from './types';
import { COMMODITY_TYPES_TRADE, TRADE_TYPES, DIRECTIONS, TRADE_STATUSES, SETTLEMENT_TYPES_TRADE } from './types';
import { useTraders } from '@features/organization/traders/hooks';
import { useBooks } from '@features/organization/books/hooks';
import { useProducts } from '@features/markets/products/hooks';
import { useMarkets } from '@features/markets/markets/hooks';
import { usePricingRules } from '@features/pricing/pricing-rules/hooks';
import { useLocations } from '@features/logistics/locations/hooks';
import { useVessels } from '@features/logistics/vessels/hooks';
import { usePeriods } from '@features/calendar/periods/hooks';
import { useUom } from '@features/reference/uom/hooks';
import { useTableRows } from '@features/tier2/hooks';

const { Text } = Typography;

// ─── Colour maps ──────────────────────────────────────────────────────────────
const COMMODITY_COLOR: Record<string, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', LNG: 'cyan',
  AGRICULTURAL: 'green', METALS: 'purple', FREIGHT: 'orange',
};
const DIRECTION_COLOR: Record<string, string> = { BUY: 'green', SELL: 'red' };
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', CONFIRMED: 'success', AMENDED: 'warning',
  CANCELLED: 'error', MATURED: 'blue', CLOSED: 'default',
};
const TRADE_TYPE_COLOR: Record<string, string> = {
  PHYSICAL: 'orange', FINANCIAL: 'geekblue', OPTION: 'purple', FREIGHT: 'cyan',
};

type SelectOpt = { value: string; label: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function sectionTitle(label: string) {
  return (
    <Divider orientation="left" style={{ margin: '16px 0 8px', fontSize: 12, color: '#888' }}>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </Divider>
  );
}

// ─── OIL detail section ───────────────────────────────────────────────────────
function OilSection({ locations, vessels, crudeGrades }: { locations: SelectOpt[]; vessels: SelectOpt[]; crudeGrades: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('Oil Cargo Details')}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['oilDetail', 'crudeGrade']} label={hint('Crude Grade', 'The crude oil benchmark or named blend traded — e.g. Forties, Urals, Arab Light. Determines applicable API/sulphur specs.', 'FORTIES')}>
            <Select options={crudeGrades} placeholder="Select grade" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['oilDetail', 'apiGravity']} label={hint('API Gravity', 'American Petroleum Institute gravity — higher = lighter crude. Brent ≈ 38°, WTI ≈ 40°, VLCC cargoes often <32° (heavy).')}>
            <InputNumber placeholder="38.5" precision={1} suffix="°API" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['oilDetail', 'sulphurPct']} label={hint('Sulphur %', 'Sulphur content by weight. Sweet crude <0.5%. Sour crude >0.5%. Higher sulphur = processing cost penalty.')}>
            <InputNumber placeholder="0.26" precision={3} suffix="% wt" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['oilDetail', 'loadLocationCode']} label="Load Port / Terminal">
            <Select options={locations} placeholder="Load port" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['oilDetail', 'dischargeLocationCode']} label="Discharge Port">
            <Select options={locations} placeholder="Discharge port" allowClear showSearch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['oilDetail', 'vesselName']} label={hint('Vessel', 'Named vessel for the cargo. If TBN (To Be Named) leave blank and update before BIMCO laycan opens.')}>
            <Select options={vessels} placeholder="Select vessel (TBN if unknown)" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['oilDetail', 'laycanStart']} label={hint('Laycan Start', 'Earliest date vessel can present at load port for NOR (Notice of Readiness) tender.')}>
            <Input placeholder="2026-07-10" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['oilDetail', 'laycanEnd']} label="Laycan End">
            <Input placeholder="2026-07-12" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'blDate']} label={hint('B/L Date', 'Bill of Lading date — legal date of title transfer and pricing trigger for most crude contracts.')}>
            <Input placeholder="2026-07-11" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'norsTenderedDate']} label="NOR Tendered">
            <Input placeholder="2026-07-10T06:00" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'codDate']} label={hint('COD Date', 'Completion of Discharge — triggers final quantity determination and demurrage calculation start.')}>
            <Input placeholder="2026-07-14" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── GAS detail section ───────────────────────────────────────────────────────
function GasSection({ nominationTypes, gasDayTypes }: { nominationTypes: SelectOpt[]; gasDayTypes: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('Gas Delivery Details')}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['gasDetail', 'deliveryHub']} label={hint('Delivery Hub', 'Virtual trading point where gas is notionally delivered. TTF, NBP, NCG, GASPOOL, ZTP, AECO.')}>
            <Input placeholder="TTF-NL" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'swingPct']} label={hint('Swing %', 'Permitted variance in daily offtake vs. contracted daily quantity. 10% swing = ±10% each gas day.')}>
            <InputNumber placeholder="10" min={0} max={100} suffix="%" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'nominationType']} label={hint('Nomination', 'FIRM = guaranteed capacity. INTERRUPTIBLE = supplier can curtail with notice — cheaper but unreliable.')}>
            <Select options={nominationTypes} allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'gasDeliveryStart']} label="Delivery Start">
            <Input placeholder="2026-07-01" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'gasDeliveryEnd']} label="Delivery End">
            <Input placeholder="2026-07-31" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'gasDayType']} label={hint('Gas Day Type', 'STANDARD = 06:00–06:00 UK time (NBP). EXTENDED = some European hubs use different boundaries.')}>
            <Select options={gasDayTypes} allowClear />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── POWER detail section ─────────────────────────────────────────────────────
function PowerSection({ powerLoadTypes }: { powerLoadTypes: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('Power Delivery Details')}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'loadType']} label={hint('Load Type', 'BASELOAD = 24h/day every day. PEAK = defined peak hours (e.g. Mon–Fri 07:00–23:00). OFF_PEAK = remaining hours.')}>
            <Select options={powerLoadTypes} allowClear />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'mwCapacity']} label={hint('MW Capacity', 'Contracted power capacity in megawatts. Volume (MWh) = MW × delivery hours.')}>
            <InputNumber placeholder="50" suffix="MW" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'mwhVolume']} label={hint('MWh Volume', 'Total energy volume. Baseload monthly: MW × 24h × days. Auto-calculated from MW × hours if left blank.')}>
            <InputNumber placeholder="37200" suffix="MWh" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'deliveryStart']} label="Delivery Start">
            <Input placeholder="2026-07-01" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'deliveryEnd']} label="Delivery End">
            <Input placeholder="2026-07-31" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'interconnector']} label={hint('Interconnector', 'Cross-border power cable if relevant — e.g. BritNed (GB-NL), IFA (GB-FR). Used for grid scheduling.')}>
            <Input placeholder="BritNed" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── LNG detail section ───────────────────────────────────────────────────────
function LngSection({ locations, lngPriceBases }: { locations: SelectOpt[]; lngPriceBases: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('LNG Cargo Details')}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['lngDetail', 'loadTerminalCode']} label={hint('Load Terminal', 'LNG liquefaction terminal. Freeport, Sabine Pass, Qatar Ras Laffan, Australia Gorgon, etc.')}>
            <Select options={locations} placeholder="Load terminal" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['lngDetail', 'dischargeTerminalCode']} label="Discharge Terminal (Regasification)">
            <Select options={locations} placeholder="Discharge terminal" allowClear showSearch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name={['lngDetail', 'cargoVolumeMmbtu']} label={hint('Cargo Volume (MMBtu)', 'LNG cargo volume in MMBtu. Typical QFLEX cargo ≈ 3.4 BCF = 3,400,000 MMBtu.')}>
            <InputNumber placeholder="3400000" style={{ width: '100%' }} suffix="MMBtu" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['lngDetail', 'priceBasis']} label={hint('Price Basis', 'LNG pricing linkage. JCC (Japan Crude Cocktail) for Asia. HH (Henry Hub) for US export. TTF/NBP for Europe.')}>
            <Select options={lngPriceBases} allowClear />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── METALS detail section ────────────────────────────────────────────────────
function MetalsSection({ locations, metalShapes }: { locations: SelectOpt[]; metalShapes: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('Metal Physical Details')}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['metalsDetail', 'metalGrade']} label={hint('Metal Grade', 'LME Grade A Copper = 99.9935% purity. Primary Aluminium = 99.7% Al. Ensure grade matches contract spec.')}>
            <Input placeholder="GRADE_A" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['metalsDetail', 'shape']} label={hint('Shape / Form', 'Physical form of the metal. Cathode (copper), Ingot (lead/zinc), Billet (aluminium extrusion), Coil (steel).')}>
            <Select options={metalShapes} allowClear />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['metalsDetail', 'brand']} label={hint('Brand', 'LME-approved brand/producer. Only listed brands can be delivered against LME contracts. Affects premium.')}>
            <Input placeholder="AURUBIS / CODELCO / FREEPORT" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['metalsDetail', 'lmeDate']} label={hint('LME Date', 'The LME prompt date — cash (T+2) or forward date for 3-month pricing. Critical for daily carry calculation.')}>
            <Input placeholder="2026-07-01" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['metalsDetail', 'warehouseLocationCode']} label={hint('Warehouse / Location', 'LME-approved warehouse location. Affects delivery premium — Rotterdam, Johor, New Orleans, etc.')}>
            <Select options={locations} placeholder="LME warehouse" allowClear showSearch />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── AGRI detail section ──────────────────────────────────────────────────────
function AgriSection() {
  return (
    <>
      {sectionTitle('Agricultural / Grain Details')}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name={['agriDetail', 'cropYear']} label={hint('Crop Year', 'Marketing year of the crop — wheat 2026/27 = harvested Jul 2026. Critical for seasonal carry and stock draws.')}>
            <InputNumber placeholder="2026" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['agriDetail', 'originCountry']} label={hint('Origin Country', 'Country of origin — affects phytosanitary certificates, import quotas, and GMO labelling requirements.', 'FR', 'ISO 3166-2')}>
            <Input placeholder="FR" maxLength={2} style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name={['agriDetail', 'gradeQuality']} label={hint('Grade / Quality', 'Specification string e.g. EU MILLING WHEAT MIN 12% PROTEIN, MAX 14% MOISTURE, MAX 12% FOREIGN MATTER')}>
            <Input placeholder="EU MILLING WHEAT MIN 12% PROTEIN" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name={['agriDetail', 'deliveryBasis']} label={hint('Delivery Basis', 'Incoterm + location string used in agri contracts, e.g. FOB ROUEN, CIF ROTTERDAM PORT, FCA DUNKIRK')}>
            <Input placeholder="FOB ROUEN" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export function TradeBlotter() {
  const { data: trades = [], isLoading, refetch } = useTrades();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: incoterms = [] } = useIncoterms();
  const { data: traders = [] } = useTraders();
  const { data: books = [] } = useBooks();
  const { data: products = [] } = useProducts();
  const { data: markets = [] } = useMarkets();
  const { data: pricingRules = [] } = usePricingRules();
  const { data: locations = [] } = useLocations();
  const { data: vessels = [] } = useVessels();
  const { data: periods = [] } = usePeriods();
  const { data: uomRows = [] }             = useUom();
  const { data: currencyRows = [] }        = useTableRows('currency');
  const { data: crudeGradeRows = [] }      = useTableRows('crude_grade_type');
  const { data: metalShapeRows = [] }      = useTableRows('metal_shape');
  const { data: gasDayTypeRows = [] }      = useTableRows('gas_day_type');
  const { data: nominationTypeRows = [] }  = useTableRows('nomination_type');
  const { data: lngPriceBasisRows = [] }   = useTableRows('lng_price_basis');
  const { data: powerLoadTypeRows = [] }   = useTableRows('power_load_type');

  const saveTrade = useSaveTrade();
  const cancelTrade = useCancelTrade();
  const confirmTrade = useConfirmTrade();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [commodityType, setCommodityType] = useState<CommodityTypeTrade>('OIL');
  const [form] = Form.useForm<TradeInput>();

  const locationOpts = useMemo(() =>
    (locations as { locationCode: string; locationName: string }[]).map((l) => ({
      value: l.locationCode,
      label: `${l.locationCode} — ${l.locationName}`,
    })), [locations]);

  const vesselOpts = useMemo(() =>
    (vessels as { vesselName: string; imoNumber: string }[]).map((v) => ({
      value: v.vesselName,
      label: `${v.vesselName} (${v.imoNumber})`,
    })), [vessels]);

  const uomOpts          = useMemo(() => (uomRows        as { uomCode: string }[]).map((r) => ({ value: r.uomCode, label: r.uomCode })), [uomRows]);
  const currencyOpts     = useMemo(() => (currencyRows   as { currencyCode: string; currencyName: string }[]).map((r) => ({ value: r.currencyCode, label: `${r.currencyCode} — ${r.currencyName}` })), [currencyRows]);
  const crudeGradeOpts   = useMemo(() => (crudeGradeRows as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: `${r.typeCode} — ${r.typeName}` })), [crudeGradeRows]);
  const metalShapeOpts   = useMemo(() => (metalShapeRows as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [metalShapeRows]);
  const gasDayTypeOpts   = useMemo(() => (gasDayTypeRows as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [gasDayTypeRows]);
  const nominationOpts   = useMemo(() => (nominationTypeRows as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [nominationTypeRows]);
  const lngPriceOpts     = useMemo(() => (lngPriceBasisRows as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [lngPriceBasisRows]);
  const powerLoadOpts    = useMemo(() => (powerLoadTypeRows as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [powerLoadTypeRows]);

  function openNew() {
    setEditing(null);
    setCommodityType('OIL');
    form.resetFields();
    form.setFieldsValue({ commodityType: 'OIL', tradeType: 'PHYSICAL', direction: 'BUY', status: 'DRAFT', settlementType: 'PHYSICAL', uomCode: 'BBL', currencyCode: 'USD' });
    setOpen(true);
  }

  function openEdit(t: Trade) {
    setEditing(t);
    setCommodityType(t.commodityType);
    form.setFieldsValue({
      ...t,
      oilDetail: t.oilDetail ?? undefined,
      gasDetail: t.gasDetail ?? undefined,
      powerDetail: t.powerDetail ?? undefined,
      lngDetail: t.lngDetail ?? undefined,
      metalsDetail: t.metalsDetail ?? undefined,
      agriDetail: t.agriDetail ?? undefined,
    });
    setOpen(true);
  }

  function onCommodityChange(val: string) {
    const ct = val as CommodityTypeTrade;
    setCommodityType(ct);
    form.setFieldValue('commodityType', ct);
    // auto-set UoM default
    const defaultUom: Record<string, string> = { OIL: 'BBL', GAS: 'MWH', POWER: 'MWH', LNG: 'MMBTU', METALS: 'MT', AGRICULTURAL: 'MT', FREIGHT: 'MT' };
    form.setFieldValue('uomCode', defaultUom[ct] ?? 'BBL');
  }

  async function submit() {
    const values = await form.validateFields();
    await saveTrade.mutateAsync({ id: editing?.tradeId ?? null, input: values as TradeInput });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<Trade>[]>(() => [
    {
      field: 'tradeReference', headerName: 'Reference', width: 160, pinned: 'left', cellClass: 'cell-mono',
      cellRenderer: (p: { value: string }) => <span style={{ fontWeight: 600 }}>{p.value}</span>,
    },
    { field: 'tradeDate', headerName: 'Trade Date', width: 110, cellClass: 'cell-mono' },
    {
      field: 'commodityType', headerName: 'Commodity', width: 110,
      cellRenderer: (p: { value: string }) => <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      field: 'tradeType', headerName: 'Type', width: 95,
      cellRenderer: (p: { value: string }) => <Tag color={TRADE_TYPE_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      field: 'direction', headerName: 'B/S', width: 70,
      cellRenderer: (p: { value: string }) => (
        <Tag color={DIRECTION_COLOR[p.value]} style={{ fontWeight: 700 }}>{p.value}</Tag>
      ),
    },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 170 },
    { field: 'traderCode', headerName: 'Trader', width: 80, cellClass: 'cell-mono' },
    { field: 'bookCode', headerName: 'Book', width: 120, cellClass: 'cell-mono' },
    { field: 'productCode', headerName: 'Product', width: 140, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Quantity', width: 140,
      valueGetter: (p) => `${Number(p.data?.quantity ?? 0).toLocaleString()} ${p.data?.uomCode ?? ''}`,
    },
    {
      headerName: 'Price', width: 130,
      valueGetter: (p) => p.data ? `${p.data.currencyCode} ${Number(p.data.price).toFixed(2)}` : '',
    },
    { field: 'periodCode', headerName: 'Period', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'status', headerName: 'Status', width: 110,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      headerName: '', width: 120, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Trade }) => (
        <Space size={2}>
          <Tooltip title="Edit">
            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          </Tooltip>
          {p.data.status === 'DRAFT' && (
            <Tooltip title="Confirm">
              <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#22c55e' }}
                onClick={() => confirmTrade.mutate(p.data.tradeId)} />
            </Tooltip>
          )}
          {(p.data.status === 'DRAFT' || p.data.status === 'CONFIRMED') && (
            <Popconfirm
              title="Cancel trade?"
              description={`${p.data.tradeReference} will be marked CANCELLED.`}
              onConfirm={() => cancelTrade.mutate(p.data.tradeId)}
              okText="Cancel Trade" okButtonProps={{ danger: true }}
            >
              <Tooltip title="Cancel">
                <Button type="text" size="small" danger icon={<StopOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [cancelTrade, confirmTrade]);

  return (
    <>
      <PageHeader
        title="Trade Blotter"
        description="Manual trade capture across all commodity desks — oil, gas, power, LNG, metals, and agricultural."
        moduleGroup="trade"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={trades}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Trade"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.tradeId)}
      />

      <Drawer
        title={
          <Space>
            <SwapOutlined />
            {editing ? `Edit Trade — ${editing.tradeReference}` : 'New Trade'}
          </Space>
        }
        open={open}
        onClose={() => setOpen(false)}
        width={760}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={saveTrade.isPending}>
              {editing ? 'Update Trade' : 'Create Trade'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small">

          {/* ── Commodity selector ── */}
          <Card size="small" style={{ marginBottom: 16, background: 'rgba(0,0,0,0.03)' }}>
            <Form.Item name="commodityType" label="Commodity Type" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <Segmented
                options={COMMODITY_TYPES_TRADE.map((c) => ({ value: c, label: c }))}
                onChange={onCommodityChange}
              />
            </Form.Item>
          </Card>

          {/* ── Core identity ── */}
          {sectionTitle('Trade Identification')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tradeDate" label={hint('Trade Date', 'Date the deal was agreed and entered. Determines pricing period, margin calls, and accounting day.')} rules={[{ required: true }]}>
                <Input placeholder="2026-06-27" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tradeType" label={hint('Trade Type', 'PHYSICAL = delivery of commodity. FINANCIAL = cash-settled, no delivery. OPTION = right but not obligation.')} rules={[{ required: true }]}>
                <Select options={TRADE_TYPES.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="direction" label={hint('Direction', 'BUY = long position, taking delivery or receiving cash on settlement. SELL = short position.')} rules={[{ required: true }]}>
                <Select options={DIRECTIONS.map((d) => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={TRADE_STATUSES.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="executionDatetime" label="Execution Time">
                <Input placeholder="2026-06-27T09:30:00Z" />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Counterparty & book ── */}
          {sectionTitle('Counterparty & Book')}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="counterpartyId" label={hint('Counterparty', 'The external party you are trading with. Must be an approved and KYC-verified counterparty.')} rules={[{ required: true }]}>
                <Select
                  options={(counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[]).map((cp) => ({ value: cp.counterpartyId, label: `${cp.counterpartyCode} — ${cp.name}` }))}
                  placeholder="Select counterparty" showSearch
                  filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="legalEntityId" label={hint('Legal Entity', 'Your company entity entering this trade — determines contract jurisdiction, currency, and tax treatment.')} rules={[{ required: true }]}>
                <Select
                  options={(legalEntities as { legalEntityId: number; entityCode: string; name: string }[]).map((le) => ({ value: le.legalEntityId, label: `${le.entityCode} — ${le.name}` }))}
                  placeholder="Select legal entity" showSearch
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="traderId" label="Trader" rules={[{ required: true }]}>
                <Select
                  options={(traders as { traderId: number; traderCode: string; fullName: string }[]).map((t) => ({ value: t.traderId, label: `${t.traderCode} — ${t.fullName}` }))}
                  placeholder="Select trader" showSearch
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="bookId" label={hint('Book', 'Trading book for P&L attribution and position aggregation. Must match commodity and desk.')} rules={[{ required: true }]}>
                <Select
                  options={(books as { bookId: number; bookCode: string; bookName: string }[]).map((b) => ({ value: b.bookId, label: `${b.bookCode} — ${b.bookName}` }))}
                  placeholder="Select book" showSearch
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Product & market ── */}
          {sectionTitle('Product & Market')}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="productId" label="Product">
                <Select
                  options={(products as { productId: number; productCode: string; productName: string }[]).map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` }))}
                  placeholder="Select product" showSearch allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="marketId" label={hint('Market', 'Trading venue or OTC market where this trade was executed. Determines clearing, margin, and reporting obligations.')}>
                <Select
                  options={(markets as { marketId: number; marketCode: string; marketName: string }[]).map((m) => ({ value: m.marketId, label: `${m.marketCode} — ${m.marketName}` }))}
                  placeholder="Select market" showSearch allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pricingRuleId" label={hint('Pricing Rule', 'How the price is determined — FIXED, FLOATING (index), DIFFERENTIAL (vs index ± spread), FORMULA, AVERAGE over period.')}>
                <Select
                  options={(pricingRules as { pricingRuleId: number; ruleCode: string; ruleName: string }[]).map((r) => ({ value: r.pricingRuleId, label: `${r.ruleCode} — ${r.ruleName}` }))}
                  placeholder="Select pricing rule" showSearch allowClear
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="periodCode" label={hint('Period', 'Delivery or pricing period — monthly (M2026-07), quarterly (Q2026-Q3), annual (Y2026), or SPOT.')}>
                <Select
                  options={(periods as { periodCode: string; periodName: string }[]).map((p) => ({ value: p.periodCode, label: `${p.periodCode} — ${p.periodName}` }))}
                  placeholder="Select period" showSearch allowClear
                />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Pricing ── */}
          {sectionTitle('Quantity & Pricing')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="quantity" label={hint('Quantity', 'Nominal quantity in the selected unit. For OIL crude: typically in BBL (500,000 BBL = ~1 VLCC cargo). For gas: MWh/MMBTU.')} rules={[{ required: true }]}>
                <InputNumber placeholder="500000" style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="uomCode" label="Unit of Measure" rules={[{ required: true }]}>
                <Select options={uomOpts} showSearch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="price" label={hint('Price', 'Trade price per unit. For floating/differential pricing, this is the fixing price at time of booking — will be updated at pricing date.')}>
                <InputNumber placeholder="82.45" precision={4} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="currencyCode" label="Currency" rules={[{ required: true }]}>
                <Select options={currencyOpts} showSearch />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Delivery ── */}
          {sectionTitle('Delivery & Settlement')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="incotermCode" label={hint('Incoterm', 'Trade delivery terms — FOB (seller loads), CIF (seller insures & freights to port), DES (seller delivers to vessel).')}>
                <Select
                  options={(incoterms as { incotermCode: string; incotermName: string }[]).map((i) => ({ value: i.incotermCode, label: `${i.incotermCode} — ${i.incotermName}` }))}
                  placeholder="FOB / CIF / DAP" showSearch allowClear
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="deliveryLocationCode" label="Delivery Location">
                <Select options={locationOpts} placeholder="Delivery point" showSearch allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="settlementType" label={hint('Settlement Type', 'PHYSICAL = commodity changes hands. FINANCIAL = net cash payment. NETTED = offset against opposite position.')}>
                <Select options={SETTLEMENT_TYPES_TRADE.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>

          {/* ── Commodity-specific sections ── */}
          {commodityType === 'OIL' && (
            <OilSection locations={locationOpts} vessels={vesselOpts} crudeGrades={crudeGradeOpts} />
          )}
          {commodityType === 'GAS' && <GasSection nominationTypes={nominationOpts} gasDayTypes={gasDayTypeOpts} />}
          {commodityType === 'POWER' && <PowerSection powerLoadTypes={powerLoadOpts} />}
          {commodityType === 'LNG' && <LngSection locations={locationOpts} lngPriceBases={lngPriceOpts} />}
          {commodityType === 'METALS' && <MetalsSection locations={locationOpts} metalShapes={metalShapeOpts} />}
          {commodityType === 'AGRICULTURAL' && <AgriSection />}

          {/* ── Notes ── */}
          {sectionTitle('Notes')}
          <Form.Item name="notes">
            <Input.TextArea rows={3} placeholder="Trade notes, special conditions, internal comments..." />
          </Form.Item>

        </Form>
      </Drawer>
    </>
  );
}
