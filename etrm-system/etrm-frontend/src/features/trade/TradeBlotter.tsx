import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select,
  InputNumber, Divider, Typography, Row, Col, Segmented, Card,
  Tooltip, Table, Alert, Badge, Empty, Switch,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useFieldPermissions } from '@permissions/useFieldPermissions';
import {
  EditOutlined, StopOutlined, CheckCircleOutlined,
  SwapOutlined, PlusOutlined, UnorderedListOutlined, DeleteOutlined,
  TagOutlined, MinusCircleOutlined,
} from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import {
  useTrades, useSaveTrade, useCancelTrade, useConfirmTrade,
  useCounterparties, useLegalEntities, useIncoterms, useBrokers, usePipelines,
  useTradeOrders, useSaveTradeOrder, useCancelTradeOrder, useConfirmTradeOrder,
  useTradeItems, useSaveTradeItem, useDeleteTradeItem,
} from './hooks';
import type {
  Trade, TradeInput, TradeOrder, TradeOrderInput, TradeItem, TradeItemInput,
  CommodityTypeTrade,
} from './types';
import {
  COMMODITY_TYPES_TRADE, TRADE_TYPES, DIRECTIONS, TRADE_STATUSES, ORDER_STATUSES,
  SETTLEMENT_TYPES_TRADE, CONTRACT_TYPES, BROKER_FEE_TYPES, CREDIT_TERM_CODES,
  CREDIT_APPROVAL_STATUSES, FREIGHT_VESSEL_TYPES, FREIGHT_RATE_TYPES, FREIGHT_CHARTER_TYPES,
  TERM_TYPES, DEAL_INDICATORS, RFP_FREQUENCIES,
  CONTRACT_PERIODICITIES, CONTRACT_DEAL_STATUSES, TOLERANCE_TYPES,
  INSTRUMENT_TYPES, PRICE_ADJUSTMENT_TYPES, DEMURRAGE_BASIS_TYPES,
  RIN_ASSIGNMENT_STATUSES, ENV_PRODUCT_TYPES,
} from './types';
import { useTraders } from '@features/organization/traders/hooks';
import { useBooks } from '@features/organization/books/hooks';
import { useProducts } from '@features/markets/products/hooks';
import { useMarkets } from '@features/markets/markets/hooks';
import { usePricingRules } from '@features/pricing/pricing-rules/hooks';
import type { PricingRule } from '@features/pricing/pricing-rules/types';
import { useBalmoProducts } from '@features/pricing/balmo-products/hooks';
import type { BalmoProduct } from '@features/pricing/balmo-products/types';
import { useLocations } from '@features/logistics/locations/hooks';
import { useVessels } from '@features/logistics/vessels/hooks';
import { usePeriods } from '@features/calendar/periods/hooks';
import { useUom } from '@features/reference/uom/hooks';
import { useCommodityInstrumentMap } from '@features/reference/commodity-instrument-map/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useUiStore } from '@store/uiStore';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';

const { Text } = Typography;

/** Converts named string-date fields on a nested detail object (oilDetail, gasDetail, ...) to dayjs for the form. */
function detailToForm<T extends object>(obj: T | null | undefined, dateFields: (keyof T)[]): Record<string, unknown> | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = { ...obj } as Record<string, unknown>;
  for (const f of dateFields) {
    const v = out[f as string];
    if (typeof v === 'string' && v) out[f as string] = dayjs(v);
  }
  return out;
}
/** Reverses `detailToForm` — dayjs fields back to ISO strings for the API payload. */
function detailFromForm<T extends object>(obj: T | null | undefined, dateFields: (keyof T)[]): Record<string, unknown> | null | undefined {
  if (!obj) return obj as null | undefined;
  const out: Record<string, unknown> = { ...obj } as Record<string, unknown>;
  for (const f of dateFields) {
    const v = out[f as string];
    if (v && typeof v === 'object' && 'format' in (v as object)) out[f as string] = (v as Dayjs).format('YYYY-MM-DD');
  }
  return out;
}

// ─── Colour maps ──────────────────────────────────────────────────────────────
const COMMODITY_COLOR: Record<string, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', LNG: 'cyan',
  AGRICULTURAL: 'green', METALS: 'purple', FREIGHT: 'orange',
  RINS: 'lime', ENVIRONMENTAL: 'geekblue',
};
const DIRECTION_COLOR: Record<string, string> = { BUY: 'green', SELL: 'red' };
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', CONFIRMED: 'success', AMENDED: 'warning',
  CANCELLED: 'error', MATURED: 'blue', CLOSED: 'default',
};
const ORDER_STATUS_COLOR: Record<string, string> = {
  WORKING: 'orange', CONFIRMED: 'success', SETTLED: 'blue', CANCELLED: 'error',
};
const TRADE_TYPE_COLOR: Record<string, string> = {
  PHYSICAL: 'orange', FINANCIAL: 'geekblue', OPTION: 'purple', FREIGHT: 'cyan',
};

type SelectOpt = { value: string | number; label: string };

function sectionTitle(label: string) {
  return (
    <Divider orientation="left" style={{ margin: '16px 0 8px', fontSize: 12, color: '#888' }}>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </Divider>
  );
}

// ─── OIL detail section ───────────────────────────────────────────────────────
function OilSection({ locations, vessels, crudeGrades, pipelines }: {
  locations: SelectOpt[]; vessels: SelectOpt[]; crudeGrades: SelectOpt[]; pipelines: SelectOpt[];
}) {
  const motType = Form.useWatch(['oilDetail', 'motType']);
  return (
    <>
      {sectionTitle('Oil Cargo Details')}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'crudeGrade']} label={hint('Crude Grade', 'Crude oil benchmark or named blend — e.g. Forties, Urals, Arab Light.')}>
            <Select options={crudeGrades} placeholder="Select grade" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'apiGravity']} label={hint('API Gravity', 'Higher = lighter crude. Brent ≈ 38°, WTI ≈ 40°, Arab Heavy ≈ 27°.')}>
            <InputNumber placeholder="38.5" precision={1} suffix="°API" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'sulphurPct']} label={hint('Sulphur %wt', 'Sweet crude <0.5%. Sour crude >0.5%.')}>
            <InputNumber placeholder="0.26" precision={3} suffix="% wt" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'motType']} label={hint('MOT', 'TANKER for seagoing crude, PIPELINE for onshore, BARGE for river, TRUCK for road.')}>
            <Select options={['TANKER', 'PIPELINE', 'BARGE', 'TRUCK'].map((v) => ({ value: v, label: v }))} placeholder="Select MOT" allowClear />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'loadLocationCode']} label="Load Port / Terminal">
            <Select options={locations} placeholder="Load port" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'dischargeLocationCode']} label="Discharge Port">
            <Select options={locations} placeholder="Discharge port" allowClear showSearch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'titleTransferLocationCode']} label={hint('Title Transfer', 'FOB = at load port. CIF/DES = at discharge.')}>
            <Select options={locations} placeholder="Title transfer location" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['oilDetail', 'vesselName']} label={hint('Vessel', 'Leave blank (TBN) and update before laycan opens.')}>
            <Select options={vessels} placeholder="Select vessel (TBN if unknown)" allowClear showSearch />
          </Form.Item>
        </Col>
        {motType === 'PIPELINE' && (
          <Col span={8}>
            <Form.Item name={['oilDetail', 'pipelineId']} label={hint('Pipeline', 'The specific pipeline. Determines TSO, tariff, and scheduling rules.')}>
              <Select options={pipelines} placeholder="Select pipeline" allowClear showSearch />
            </Form.Item>
          </Col>
        )}
      </Row>
      <Row gutter={16}>
        <Col span={6}><Form.Item name={['oilDetail', 'laycanStart']} label={hint('Laycan Start', 'Earliest date vessel can present at load port.')}><AppDatePicker /></Form.Item></Col>
        <Col span={6}><Form.Item name={['oilDetail', 'laycanEnd']} label="Laycan End"><AppDatePicker /></Form.Item></Col>
        <Col span={6}><Form.Item name={['oilDetail', 'blDate']} label={hint('B/L Date', 'Bill of Lading date — legal date of title transfer.')}><AppDatePicker /></Form.Item></Col>
        <Col span={6}><Form.Item name={['oilDetail', 'norsTenderedDate']} label={hint('NOR Tendered', 'Notice of Readiness — starts demurrage clock.')}><AppDatePicker showTime format="YYYY-MM-DD HH:mm" /></Form.Item></Col>
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
          <Form.Item name={['gasDetail', 'deliveryHub']} label={hint('Delivery Hub', 'Virtual trading point — TTF, NBP, NCG, GASPOOL, ZTP, AECO.')}>
            <Input placeholder="TTF-NL" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'swingPct']} label={hint('Swing %', 'Permitted variance in daily offtake vs. contracted daily quantity.')}>
            <InputNumber placeholder="10" min={0} max={100} suffix="%" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'nominationType']} label={hint('Nomination', 'FIRM = guaranteed capacity. INTERRUPTIBLE = can be curtailed.')}>
            <Select options={nominationTypes} allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}><Form.Item name={['gasDetail', 'gasDeliveryStart']} label="Delivery Start"><AppDatePicker /></Form.Item></Col>
        <Col span={6}><Form.Item name={['gasDetail', 'gasDeliveryEnd']} label="Delivery End"><AppDatePicker /></Form.Item></Col>
        <Col span={6}>
          <Form.Item name={['gasDetail', 'gasDayType']} label={hint('Gas Day Type', 'STANDARD = 06:00–06:00 UK time (NBP).')}>
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
          <Form.Item name={['powerDetail', 'loadType']} label={hint('Load Type', 'BASELOAD = 24h/day. PEAK = Mon–Fri 07:00–23:00. OFF_PEAK = remaining hours.')}>
            <Select options={powerLoadTypes} allowClear />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'mwCapacity']} label={hint('MW Capacity', 'Contracted power capacity in megawatts.')}>
            <InputNumber placeholder="50" suffix="MW" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['powerDetail', 'mwhVolume']} label={hint('MWh Volume', 'Total energy volume. Baseload monthly: MW × 24h × days.')}>
            <InputNumber placeholder="37200" suffix="MWh" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}><Form.Item name={['powerDetail', 'deliveryStart']} label="Delivery Start"><AppDatePicker /></Form.Item></Col>
        <Col span={6}><Form.Item name={['powerDetail', 'deliveryEnd']} label="Delivery End"><AppDatePicker /></Form.Item></Col>
        <Col span={6}>
          <Form.Item name={['powerDetail', 'gridNodeCode']} label={hint('Grid Node', 'DE-AT-LU, PJM-AEP, ERCOT-HUB-WEST.')}>
            <Input placeholder="DE-AT-LU" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['powerDetail', 'interconnector']} label={hint('Interconnector', 'BritNed (GB-NL), IFA (GB-FR), NorNed (NO-NL).')}>
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
        <Col span={12}><Form.Item name={['lngDetail', 'loadTerminalCode']} label={hint('Load Terminal', 'Freeport, Sabine Pass, Qatar Ras Laffan, Australia Gorgon.')}><Select options={locations} placeholder="Load terminal" allowClear showSearch /></Form.Item></Col>
        <Col span={12}><Form.Item name={['lngDetail', 'dischargeTerminalCode']} label="Discharge Terminal"><Select options={locations} placeholder="Discharge terminal" allowClear showSearch /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}><Form.Item name={['lngDetail', 'titleTransferLocationCode']} label={hint('Title Transfer', 'FOB LNG = loading flange. DES/DAP = discharge terminal.')}><Select options={locations} placeholder="Title transfer point" allowClear showSearch /></Form.Item></Col>
        <Col span={6}><Form.Item name={['lngDetail', 'motType']} label="MOT"><Select options={[{ value: 'SHIP', label: 'SHIP (LNG Tanker)' }]} placeholder="SHIP" allowClear /></Form.Item></Col>
        <Col span={10}><Form.Item name={['lngDetail', 'cargoVolumeMmbtu']} label={hint('Cargo Volume (MMBtu)', 'QFLEX cargo ≈ 3,400,000 MMBtu.')}><InputNumber placeholder="3400000" style={{ width: '100%' }} suffix="MMBtu" /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name={['lngDetail', 'priceBasis']} label={hint('Price Basis', 'JCC for Asia. HH for US. TTF/NBP for Europe.')}><Select options={lngPriceBases} allowClear /></Form.Item></Col>
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
        <Col span={8}><Form.Item name={['metalsDetail', 'metalGrade']} label={hint('Metal Grade', 'LME Grade A Copper = 99.9935% purity.')}><Input placeholder="GRADE_A" style={{ fontFamily: 'monospace' }} /></Form.Item></Col>
        <Col span={8}><Form.Item name={['metalsDetail', 'shape']} label={hint('Shape / Form', 'Cathode (copper), Ingot, Billet, Coil, Rod, Slab, Wire.')}><Select options={metalShapes} allowClear /></Form.Item></Col>
        <Col span={8}><Form.Item name={['metalsDetail', 'brand']} label={hint('Brand', 'LME-approved brand only.')}>< Input placeholder="AURUBIS / CODELCO" /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}><Form.Item name={['metalsDetail', 'motType']} label="MOT"><Select options={['SHIP', 'TRUCK', 'RAIL', 'BARGE'].map((v) => ({ value: v, label: v }))} placeholder="MOT" allowClear /></Form.Item></Col>
        <Col span={8}><Form.Item name={['metalsDetail', 'lmeDate']} label={hint('LME Date', 'Cash (T+2) or 3-month forward prompt date.')}><AppDatePicker /></Form.Item></Col>
        <Col span={8}><Form.Item name={['metalsDetail', 'warehouseLocationCode']} label="Warehouse"><Select options={locations} placeholder="LME warehouse" allowClear showSearch /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Form.Item name={['metalsDetail', 'titleTransferLocationCode']} label="Title Transfer Location"><Select options={locations} placeholder="Title transfer point" allowClear showSearch /></Form.Item></Col>
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
        <Col span={6}><Form.Item name={['agriDetail', 'cropYear']} label={hint('Crop Year', 'Marketing year — wheat 2026/27 = harvested Jul 2026.')}><InputNumber placeholder="2026" style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={6}><Form.Item name={['agriDetail', 'originCountry']} label={hint('Origin', 'ISO 3166-2 code.')}><Input placeholder="FR" maxLength={2} style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} /></Form.Item></Col>
        <Col span={12}><Form.Item name={['agriDetail', 'gradeQuality']} label="Grade / Quality"><Input placeholder="EU MILLING WHEAT MIN 12% PROTEIN" /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={16}><Form.Item name={['agriDetail', 'deliveryBasis']} label={hint('Delivery Basis', 'Incoterm + location — FOB ROUEN, CIF ROTTERDAM')}><Input placeholder="FOB ROUEN" /></Form.Item></Col>
        <Col span={8}><Form.Item name={['agriDetail', 'motType']} label="MOT"><Select options={['SHIP', 'BARGE', 'TRUCK', 'RAIL'].map((v) => ({ value: v, label: v }))} placeholder="MOT" allowClear /></Form.Item></Col>
      </Row>
    </>
  );
}

// ─── FREIGHT detail section ───────────────────────────────────────────────────
function FreightSection({ locations }: { locations: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('Freight / Charter Details')}
      <Row gutter={16}>
        <Col span={8}><Form.Item name={['freightDetail', 'vesselType']} label={hint('Vessel Type', 'VLCC = 250–320kDWT. SUEZMAX = 120–200kDWT.')}><Select options={FREIGHT_VESSEL_TYPES.map((v) => ({ value: v, label: v }))} placeholder="Select vessel type" allowClear /></Form.Item></Col>
        <Col span={8}><Form.Item name={['freightDetail', 'charterType']} label={hint('Charter Type', 'VOYAGE = single trip. TIME = hired for period.')}><Select options={FREIGHT_CHARTER_TYPES.map((v) => ({ value: v, label: v }))} placeholder="Select charter type" allowClear /></Form.Item></Col>
        <Col span={8}><Form.Item name={['freightDetail', 'routeCode']} label={hint('Route Code', 'TD3C (VLCC), TC2 (MR), C3 (Cape).')}><Input placeholder="TD3C" style={{ fontFamily: 'monospace' }} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}><Form.Item name={['freightDetail', 'loadLocationCode']} label="Load Port"><Select options={locations} placeholder="Load port" allowClear showSearch /></Form.Item></Col>
        <Col span={8}><Form.Item name={['freightDetail', 'dischargeLocationCode']} label="Discharge Port"><Select options={locations} placeholder="Discharge port" allowClear showSearch /></Form.Item></Col>
        <Col span={8}><Form.Item name={['freightDetail', 'cargoSizeMT']} label={hint('Cargo Size (MT)', 'VLCC ≈ 280,000 MT.')}><InputNumber placeholder="280000" style={{ width: '100%' }} suffix="MT" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} /></Form.Item></Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}><Form.Item name={['freightDetail', 'freightRateType']} label="Rate Type"><Select options={FREIGHT_RATE_TYPES.map((v) => ({ value: v, label: v }))} placeholder="WS / $/MT / LS" allowClear /></Form.Item></Col>
        <Col span={6}><Form.Item name={['freightDetail', 'freightRate']} label="Freight Rate"><InputNumber placeholder="75.00" precision={4} style={{ width: '100%' }} /></Form.Item></Col>
        <Col span={6}><Form.Item name={['freightDetail', 'laycanStart']} label="Laycan Start"><AppDatePicker /></Form.Item></Col>
        <Col span={6}><Form.Item name={['freightDetail', 'laycanEnd']} label="Laycan End"><AppDatePicker /></Form.Item></Col>
      </Row>
    </>
  );
}

// ─── TAS detail section ────────────────────────────────────────────────────────
function TasSection() {
  return (
    <>
      {sectionTitle('TAS — Trade at Settlement')}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name={['tasDetail', 'tasContractTicker']}
            label={hint('Contract Ticker', 'Specific futures delivery month — e.g. CLZ26 (WTI Dec 2026), NGF27 (NG Jan 2027), HOF27 (HO Jan 2027). Month codes: F=Jan G=Feb H=Mar J=Apr K=May M=Jun N=Jul Q=Aug U=Sep V=Oct X=Nov Z=Dec.')}
            rules={[{ required: true, message: 'Required for TAS pricing' }]}
          >
            <Input placeholder="CLZ26" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} maxLength={6} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['tasDetail', 'tasDifferential']}
            label={hint('Differential (ticks)', 'Signed integer offset from settlement. +2 = settle + 2 ticks. 0 = exactly at settlement. -1 = settle minus 1 tick. CL tick = $0.01/bbl, NG tick = $0.001/mmbtu, HO/RB tick = $0.0001/gal.')}
            rules={[{ required: true, message: 'Required — use 0 for flat TAS' }]}
          >
            <InputNumber placeholder="0" precision={0} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['tasDetail', 'tasStatus']} label="TAS Status" rules={[{ required: true }]} initialValue="AWAITING_SETTLEMENT">
            <Select options={[
              { value: 'AWAITING_SETTLEMENT', label: 'Awaiting Settlement' },
              { value: 'PRICE_LOCKED', label: 'Price Locked' },
            ]} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['tasDetail', 'tasLockedPrice']} label={hint('Locked Price', 'Auto-filled via TAS Dashboard when settlement is published. = Settlement price + (differential × tick size).')}>
            <InputNumber placeholder="Auto-filled on lock" precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['tasDetail', 'tasSettlementDate']} label={hint('Settlement Date', 'Date the exchange daily settlement was confirmed and price locked.')}>
            <AppDatePicker />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── BALMO detail section ──────────────────────────────────────────────────────
function BalmoSection({ balmoProducts }: { balmoProducts: BalmoProduct[] }) {
  return (
    <>
      {sectionTitle('BALMO — Balance of Month Pricing')}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name={['balmoDetail', 'balmoProductId']}
            label={hint('BALMO Contract', 'Select the monthly BALMO contract listing. Each row = one month on CME/ICE. The pricing window (start→end date) is pulled from the product master.')}
            rules={[{ required: true, message: 'Required for BALMO pricing' }]}
          >
            <Select
              placeholder="Select BALMO contract month"
              showSearch
              allowClear
              options={balmoProducts.map((p) => ({
                value: p.balmoProductId,
                label: `${p.productCode} — ${p.productName} [${p.pricingStartDate}→${p.pricingEndDate}]`,
              }))}
              filterOption={(input, opt) => (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['balmoDetail', 'contractMonth']}
            label={hint('Contract Month', 'YYYY-MM format — e.g. 2026-07. The exchange month this BALMO prices against.')}
            rules={[{ required: true, message: 'Required for BALMO' }]}
          >
            <Input placeholder="2026-07" style={{ fontFamily: 'monospace' }} maxLength={7} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['balmoDetail', 'pricingStartDate']}
            label={hint('Pricing Start', 'First day prices accumulate — typically the trade/booking date. BALMO prices from THIS date to end of month, not from month start.')}
            rules={[{ required: true, message: 'Required' }]}
          >
            <AppDatePicker />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['balmoDetail', 'pricingEndDate']}
            label={hint('Pricing End', 'Last business day of the contract month — auto-derived from the BALMO product but can be overridden.')}
            rules={[{ required: true, message: 'Required' }]}
          >
            <AppDatePicker />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['balmoDetail', 'balmoStatus']}
            label="BALMO Status"
            rules={[{ required: true }]}
            initialValue="ACTIVE"
          >
            <Select options={[
              { value: 'ACTIVE', label: 'Active — Accumulating' },
              { value: 'PRICING_COMPLETE', label: 'Pricing Complete' },
              { value: 'SETTLED', label: 'Settled' },
            ]} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name={['balmoDetail', 'runningAvgPrice']}
            label={hint('Running Avg Price', 'Daily-updated arithmetic average of exchange settlements. Refreshed from the BALMO Dashboard via the sync button.')}
          >
            <InputNumber placeholder="Auto-updated daily" precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name={['balmoDetail', 'finalSettledPrice']}
            label={hint('Final Settled Price', 'The final arithmetic average on the last pricing day. Filled on settlement or manually entered.')}
          >
            <InputNumber placeholder="Filled on settlement" precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── RIN detail section ───────────────────────────────────────────────────────
function RinSection() {
  return (
    <>
      {sectionTitle('RIN Certificate Details')}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name={['rinDetail', 'dCode']} label={hint('D-Code', 'Renewable fuel category: D3 cellulosic (EV 3.0), D4 biomass-based diesel (EV 1.5), D5 advanced (EV 1.5), D6 conventional ethanol (EV 1.0), D7 cellulosic diesel (EV 1.7).')}>
            <Select options={['D3', 'D4', 'D5', 'D6', 'D7'].map((d) => ({ value: d, label: d }))} placeholder="D6" allowClear />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['rinDetail', 'vintageYear']} label={hint('Vintage Year', 'RIN generation year. Obligated parties may satisfy up to 20% of RVO with prior-year RINs.')}>
            <InputNumber placeholder="2026" min={2020} max={2030} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['rinDetail', 'assignmentStatus']} label={hint('Assignment', 'ASSIGNED = RIN travels with the physical fuel batch. SEPARATED = standalone certificate after blending.')}>
            <Select options={RIN_ASSIGNMENT_STATUSES.map((s) => ({ value: s, label: s }))} placeholder="SEPARATED" allowClear />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['rinDetail', 'fuelCategoryCode']} label={hint('Fuel Category', 'Links to RIN fuel category master data (D-code, equivalence value, RVO eligibility).')}>
            <Input placeholder="CORN-ETHANOL" />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['rinDetail', 'epaBatchNumber']} label={hint('EPA Batch #', 'EMTS batch identifier from the fuel producer.')}>
            <Input placeholder="EMTS-2026-88121" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['rinDetail', 'emtsTransferRef']} label={hint('EMTS Transfer Ref', 'EPA Moderated Transaction System reference once the buy/sell transfer is submitted.')}>
            <Input placeholder="Populated after EMTS submission" />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── Environmental detail section ────────────────────────────────────────────
function EnvironmentalSection() {
  return (
    <>
      {sectionTitle('Environmental Certificate Details')}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name={['environmentalDetail', 'envProductType']} label={hint('Product Type', 'ALLOWANCE = cap-and-trade permit (EUA, UKA, CCA). CERTIFICATE = renewable proof (REC, GO). OFFSET = project credit (VCU, CER).')}>
            <Select options={ENV_PRODUCT_TYPES.map((t) => ({ value: t, label: t }))} placeholder="ALLOWANCE" allowClear />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['environmentalDetail', 'schemeCode']} label={hint('Scheme', 'EU_ETS, UK_ETS, CA_CAP_TRADE, RGGI for compliance; VERRA, GOLD_STANDARD for voluntary.')}>
            <Input placeholder="EU_ETS" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['environmentalDetail', 'registryCode']} label={hint('Registry', 'Where certificates are held — EU Union Registry, Verra Registry, I-REC.')}>
            <Input placeholder="EU-UNION-REG" />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name={['environmentalDetail', 'vintageYear']} label={hint('Vintage', 'Compliance or generation year of the allowance/credit.')}>
            <InputNumber placeholder="2026" min={2015} max={2035} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name={['environmentalDetail', 'projectCode']} label={hint('Project', 'Offset project identifier for OFFSET type — e.g. VCS-1234 Katingan Peatland.')}>
            <Input placeholder="VCS-1234 (offsets only)" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['environmentalDetail', 'serialNumberRange']} label={hint('Serial Range', 'Certificate serial number range delivered at settlement.')}>
            <Input placeholder="VCU-100001-105000" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name={['environmentalDetail', 'retirementFlag']} label={hint('Retire on Delivery', 'ON = bought for immediate retirement (own compliance / voluntary claim), not for resale.')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── Price adjustments (physical legs) ───────────────────────────────────────
function PriceAdjustmentsSection({ currencyOpts, uomOpts }: { currencyOpts: SelectOpt[]; uomOpts: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('Price Adjustments')}
      <Form.List name="priceAdjustments">
        {(fields, { add, remove }) => (
          <>
            {fields.map(({ key, name }) => (
              <Row gutter={8} key={key} style={{ marginBottom: 6 }} align="middle">
                <Col span={5}>
                  <Form.Item name={[name, 'adjustmentType']} rules={[{ required: true, message: 'Type required' }]} style={{ marginBottom: 0 }}>
                    <Select
                      placeholder="Type"
                      options={PRICE_ADJUSTMENT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
                      showSearch
                    />
                  </Form.Item>
                </Col>
                <Col span={4}>
                  <Form.Item name={[name, 'adjustmentValue']} rules={[{ required: true, message: 'Value required' }]} style={{ marginBottom: 0 }}>
                    <InputNumber
                      placeholder="+0.50 or −0.25"
                      precision={6}
                      style={{ width: '100%' }}
                      title="Positive = adds to price; negative = subtracts"
                    />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item name={[name, 'adjustmentCurrency']} style={{ marginBottom: 0 }}>
                    <Select placeholder="CCY" options={currencyOpts} allowClear showSearch />
                  </Form.Item>
                </Col>
                <Col span={3}>
                  <Form.Item name={[name, 'adjustmentUomCode']} style={{ marginBottom: 0 }}>
                    <Select placeholder="per UoM" options={uomOpts} allowClear showSearch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name={[name, 'notes']} style={{ marginBottom: 0 }}>
                    <Input placeholder="Notes (e.g. API ref 35°, actual 38.5° → +0.175/BBL)" />
                  </Form.Item>
                </Col>
                <Col span={1}>
                  <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 16 }} />
                </Col>
              </Row>
            ))}
            <Button
              type="dashed" onClick={() => add({ adjustmentType: null, adjustmentValue: null, adjustmentCurrency: 'USD', adjustmentUomCode: null, notes: null })}
              icon={<PlusOutlined />} size="small" style={{ marginTop: 4 }}
            >
              Add Adjustment
            </Button>
            {fields.length === 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                API gravity, density, heat content, sulfur differential, markup, tax, etc.
              </Typography.Text>
            )}
          </>
        )}
      </Form.List>
    </>
  );
}

// ─── Demurrage & laytime (physical vessel cargo) ──────────────────────────────
function DemurrageSection({ currencyOpts }: { currencyOpts: SelectOpt[] }) {
  return (
    <>
      {sectionTitle('Demurrage & Laytime')}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="demurrageRate" label={hint('Demurrage Rate', 'Daily penalty charged when vessel exceeds allowed laytime at load or discharge port.')}>
            <InputNumber placeholder="30000" precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="demurrageCurrency" label="Currency">
            <Select options={currencyOpts} placeholder="USD" allowClear showSearch />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="demurrageBasis" label={hint('Basis', 'REVERSIBLE: load + discharge laytime pooled. NON_REVERSIBLE: separate allowance per port. AVERAGED: average of two ports.')}>
            <Select
              allowClear
              placeholder="Select basis"
              options={DEMURRAGE_BASIS_TYPES.map((b) => ({
                value: b,
                label: b === 'NON_REVERSIBLE' ? 'Non-Reversible' : b === 'REVERSIBLE' ? 'Reversible' : 'Averaged',
              }))}
            />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="allowedLaytimeHours" label={hint('Allowed Laytime', 'Free time in hours before demurrage starts (e.g. 72 hrs = 3 days).')}>
            <InputNumber placeholder="72" precision={2} suffix="hrs" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={4}>
          <Form.Item name="despatchRate" label={hint('Despatch Rate', 'Reward paid when vessel loads/discharges faster than laytime. Typically 50% of demurrage rate.')}>
            <InputNumber placeholder="15000" precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
    </>
  );
}

// ─── Delivery fields (legs only) ──────────────────────────────────────────────
function DeliveryFields({
  commodityType, locationOpts, vesselOpts, uomOpts, currencyOpts, incoterms, products, markets, pricingRules, periods,
  crudeGradeOpts, metalShapeOpts, gasDayTypeOpts, nominationOpts, lngPriceOpts, powerLoadOpts, pipelineOpts, isTas, isBalmo, balmoProducts,
}: {
  commodityType: CommodityTypeTrade;
  locationOpts: SelectOpt[]; vesselOpts: SelectOpt[]; uomOpts: SelectOpt[]; currencyOpts: SelectOpt[];
  incoterms: unknown[]; products: unknown[]; markets: unknown[]; pricingRules: unknown[]; periods: unknown[];
  crudeGradeOpts: SelectOpt[]; metalShapeOpts: SelectOpt[]; gasDayTypeOpts: SelectOpt[];
  nominationOpts: SelectOpt[]; lngPriceOpts: SelectOpt[]; powerLoadOpts: SelectOpt[]; pipelineOpts: SelectOpt[];
  isTas: boolean;
  isBalmo: boolean;
  balmoProducts: BalmoProduct[];
}) {
  const settlementType = Form.useWatch('settlementType');
  const isPhysical = settlementType === 'PHYSICAL';
  // commodities that can have origin country + demurrage (vessel-based physicals)
  const hasVesselPhysical = isPhysical && ['OIL', 'LNG', 'AGRICULTURAL', 'METALS'].includes(commodityType);
  // commodities that can have price quality adjustments
  const hasPriceAdj = isPhysical && ['OIL', 'GAS', 'LNG', 'AGRICULTURAL', 'METALS'].includes(commodityType);
  return (
    <>
      {/* Two-column layout: product/pricing/delivery left, commodity detail right */}
      <Row gutter={28}>
      <Col span={12} style={{ borderRight: '1px solid rgba(125,125,125,0.15)' }}>

      {sectionTitle('Product & Market')}
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="productId" label="Product">
            <Select
              options={(products as { productId: number; productCode: string; productName: string }[]).map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` }))}
              placeholder="Select product" showSearch allowClear
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="marketId" label={hint('Market', 'Trading venue or OTC market.')}>
            <Select
              options={(markets as { marketId: number; marketCode: string; marketName: string }[]).map((m) => ({ value: m.marketId, label: `${m.marketCode} — ${m.marketName}` }))}
              placeholder="Select market" showSearch allowClear
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="pricingRuleId" label={hint('Pricing Rule', 'FIXED, FLOATING (index), DIFFERENTIAL (vs index ± spread), AVERAGE.')}>
            <Select
              options={(pricingRules as { pricingRuleId: number; ruleCode: string; ruleName: string }[]).map((r) => ({ value: r.pricingRuleId, label: `${r.ruleCode} — ${r.ruleName}` }))}
              placeholder="Select pricing rule" showSearch allowClear
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="periodCode" label={hint('Period', 'Delivery or pricing period — M2026-07, Q2026-Q3, SPOT.')}>
            <Select
              options={(periods as { periodCode: string; periodName: string }[]).map((p) => ({ value: p.periodCode, label: `${p.periodCode} — ${p.periodName}` }))}
              placeholder="Select period" showSearch allowClear
            />
          </Form.Item>
        </Col>
      </Row>

      {sectionTitle('Risk Period')}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="riskStartDate" label={hint('Risk Start', 'First day this leg carries price risk.')} rules={[{ required: true, message: 'Required for position engine' }]}>
            <AppDatePicker />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="riskEndDate" label={hint('Risk End', 'Last day this leg carries price risk.')} rules={[{ required: true, message: 'Required for position engine' }]}>
            <AppDatePicker />
          </Form.Item>
        </Col>
      </Row>

      {sectionTitle('Quantity & Pricing')}
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <InputNumber placeholder="500000" style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="uomCode" label="UoM" rules={[{ required: true }]}>
            <Select options={uomOpts} showSearch />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="price" label={hint('Price', 'Leave blank for floating / TBD.')}>
            <InputNumber placeholder="82.45" precision={4} style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="currencyCode" label="Currency" rules={[{ required: true }]}>
            <Select options={currencyOpts} showSearch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="settlementType" label="Settlement" rules={[{ required: true }]}>
            <Select options={SETTLEMENT_TYPES_TRADE.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
        </Col>
      </Row>

      {sectionTitle('Delivery')}
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="incotermCode" label={hint('Incoterm', 'FOB, CIF, DES.')}>
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
        {hasVesselPhysical && (
          <Col span={8}>
            <Form.Item
              name="originCountryCode"
              label={hint('Origin Country', 'ISO 3166-1 alpha-2 country where the commodity was produced. Required for sanctions screening — e.g. GB (Forties), RU (Urals), SA (Arab Light).')}
            >
              <Input
                placeholder="GB / SA / NG / RU"
                maxLength={2}
                style={{ textTransform: 'uppercase', fontFamily: 'monospace', width: 90 }}
                onChange={(e) => e.target.value = e.target.value.toUpperCase()}
              />
            </Form.Item>
          </Col>
        )}
      </Row>

      </Col>
      <Col span={12}>

      {commodityType === 'OIL'          && <OilSection     locations={locationOpts} vessels={vesselOpts} crudeGrades={crudeGradeOpts} pipelines={pipelineOpts} />}
      {commodityType === 'GAS'          && <GasSection     nominationTypes={nominationOpts} gasDayTypes={gasDayTypeOpts} />}
      {commodityType === 'POWER'        && <PowerSection   powerLoadTypes={powerLoadOpts} />}
      {commodityType === 'LNG'          && <LngSection     locations={locationOpts} lngPriceBases={lngPriceOpts} />}
      {commodityType === 'METALS'       && <MetalsSection  locations={locationOpts} metalShapes={metalShapeOpts} />}
      {commodityType === 'AGRICULTURAL'  && <AgriSection />}
      {commodityType === 'FREIGHT'       && <FreightSection locations={locationOpts} />}
      {commodityType === 'RINS'          && <RinSection />}
      {commodityType === 'ENVIRONMENTAL' && <EnvironmentalSection />}
      {isTas && <TasSection />}
      {isBalmo && <BalmoSection balmoProducts={balmoProducts} />}

      </Col>
      </Row>

      {hasPriceAdj  && <PriceAdjustmentsSection currencyOpts={currencyOpts} uomOpts={uomOpts} />}
      {hasVesselPhysical && <DemurrageSection currencyOpts={currencyOpts} />}
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function TradeBlotter() {
  // ── Reference data ──
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: incoterms = [] } = useIncoterms();
  const { data: brokers = [] } = useBrokers();
  const { data: pipelines = [] } = usePipelines();
  const { data: traders = [] } = useTraders();
  const { data: books = [] } = useBooks();
  const { data: products = [] } = useProducts();
  const { data: markets = [] } = useMarkets();
  const { data: pricingRules = [] } = usePricingRules();
  const { data: balmoProducts = [] } = useBalmoProducts();
  const { data: locations = [] } = useLocations();
  const { data: vessels = [] } = useVessels();
  const { data: periods = [] } = usePeriods();
  const { data: uomRows = [] }            = useUom();
  const { data: commodityInstrumentMap }  = useCommodityInstrumentMap();
  // Capture drawers span the full content area — flush to the nav sidebar edge
  const { sidebarCollapsed } = useUiStore();
  const fullDrawerWidth = `calc(100vw - ${sidebarCollapsed ? 80 : 210}px)`;
  const { data: currencyRows = [] }       = useTableRows('currency');
  const { data: crudeGradeRows = [] }     = useTableRows('crude_grade_type');
  const { data: metalShapeRows = [] }     = useTableRows('metal_shape');
  const { data: gasDayTypeRows = [] }     = useTableRows('gas_day_type');
  const { data: nominationTypeRows = [] } = useTableRows('nomination_type');
  const { data: lngPriceBasisRows = [] }  = useTableRows('lng_price_basis');
  const { data: powerLoadTypeRows = [] }  = useTableRows('power_load_type');

  // ── Trades ──
  const { data: trades = [], isLoading: tradesLoading, refetch } = useTrades();
  const saveTrade = useSaveTrade();
  const cancelTrade = useCancelTrade();
  const confirmTrade = useConfirmTrade();

  // ── Selected trade ──
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const selectedTrade = useMemo(() => trades.find((t) => t.tradeId === selectedTradeId) ?? null, [trades, selectedTradeId]);
  const { data: orders = [], isLoading: ordersLoading } = useTradeOrders(selectedTradeId);
  const saveOrder = useSaveTradeOrder();
  const cancelOrder = useCancelTradeOrder();
  const confirmOrder = useConfirmTradeOrder();

  // ── Selected order (for items panel) ──
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: items = [] } = useTradeItems(selectedOrderId);
  const saveItem = useSaveTradeItem();
  const deleteItem = useDeleteTradeItem();

  // ── Trade drawer ──
  const [tradeOpen, setTradeOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [tradeCommodity, setTradeCommodity] = useState<CommodityTypeTrade>('OIL');
  const [tradeForm] = Form.useForm<TradeInput>();
  const watchedTermType = Form.useWatch('termType', tradeForm);
  const watchedInstrumentType = Form.useWatch('instrumentType', tradeForm);

  // ── Order / leg drawer ──
  const [orderOpen, setOrderOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<TradeOrder | null>(null);
  const [orderCommodity, setOrderCommodity] = useState<CommodityTypeTrade>('OIL');
  const [orderForm] = Form.useForm<TradeOrderInput>();
  const watchedOrderPricingRuleId = Form.useWatch('pricingRuleId', orderForm);
  const watchedToleranceType = Form.useWatch('toleranceType', orderForm);
  const isTasPricing = useMemo(
    () => (pricingRules as PricingRule[]).find((r) => r.pricingRuleId === watchedOrderPricingRuleId)?.pricingType === 'TAS',
    [pricingRules, watchedOrderPricingRuleId],
  );
  const isBalmoPricing = useMemo(
    () => (pricingRules as PricingRule[]).find((r) => r.pricingRuleId === watchedOrderPricingRuleId)?.pricingType === 'BALMO',
    [pricingRules, watchedOrderPricingRuleId],
  );

  // ── Item drawer ──
  const [itemOpen, setItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TradeItem | null>(null);
  const [itemForm] = Form.useForm<TradeItemInput>();

  const fp = useFieldPermissions('TRADE_BLOTTER', editingTrade ? {
    tradeStatus: editingTrade.status,
    hasInvoice: false, hasCost: false, hasShipment: false,
    tradeType: editingTrade.tradeType,
  } : undefined);

  // ── Option lists ──
  const locationOpts  = useMemo(() => (locations as { locationCode: string; locationName: string }[]).map((l) => ({ value: l.locationCode, label: `${l.locationCode} — ${l.locationName}` })), [locations]);
  const vesselOpts    = useMemo(() => (vessels   as { vesselName: string; imoNumber: string }[]).map((v) => ({ value: v.vesselName, label: `${v.vesselName} (${v.imoNumber})` })), [vessels]);
  const uomOpts       = useMemo(() => (uomRows   as { uomCode: string }[]).map((r) => ({ value: r.uomCode, label: r.uomCode })), [uomRows]);
  const currencyOpts  = useMemo(() => (currencyRows as { currencyCode: string; currencyName: string }[]).map((r) => ({ value: r.currencyCode, label: `${r.currencyCode} — ${r.currencyName}` })), [currencyRows]);
  const brokerOpts    = useMemo(() => (brokers   as { brokerId: number; brokerCode: string; brokerName: string }[]).map((b) => ({ value: b.brokerId, label: `${b.brokerCode} — ${b.brokerName}` })), [brokers]);
  const pipelineOpts  = useMemo(() => (pipelines as { pipelineId: number; pipelineCode: string; pipelineName: string }[]).map((p) => ({ value: p.pipelineId, label: `${p.pipelineCode} — ${p.pipelineName}` })), [pipelines]);
  const crudeGradeOpts= useMemo(() => (crudeGradeRows  as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: `${r.typeCode} — ${r.typeName}` })), [crudeGradeRows]);
  const metalShapeOpts= useMemo(() => (metalShapeRows  as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [metalShapeRows]);
  const gasDayTypeOpts= useMemo(() => (gasDayTypeRows  as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [gasDayTypeRows]);
  const nominationOpts= useMemo(() => (nominationTypeRows as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [nominationTypeRows]);
  const lngPriceOpts  = useMemo(() => (lngPriceBasisRows  as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [lngPriceBasisRows]);
  const powerLoadOpts = useMemo(() => (powerLoadTypeRows  as { typeCode: string; typeName: string }[]).map((r) => ({ value: r.typeCode, label: r.typeName })), [powerLoadTypeRows]);

  const deliveryFieldProps = {
    locationOpts, vesselOpts, uomOpts, currencyOpts, incoterms, products, markets,
    pricingRules, periods, crudeGradeOpts, metalShapeOpts, gasDayTypeOpts,
    nominationOpts, lngPriceOpts, powerLoadOpts, pipelineOpts,
    balmoProducts: balmoProducts as BalmoProduct[],
  };

  // ── Trade actions ──
  // Draft-resume: navigating away mid-entry stashes each open drawer; returning restores it
  useFormDraft('trade', {
    form: tradeForm, open: tradeOpen, setOpen: setTradeOpen, editing: editingTrade, setEditing: setEditingTrade,
    extra: () => ({ commodity: tradeCommodity }),
    onRestore: (_v, ex) => setTradeCommodity((ex?.['commodity'] as CommodityTypeTrade | undefined) ?? 'OIL'),
  });
  useFormDraft('trade-leg', {
    form: orderForm, open: orderOpen, setOpen: setOrderOpen, editing: editingOrder, setEditing: setEditingOrder,
    extra: () => ({ commodity: orderCommodity }),
    onRestore: (_v, ex) => setOrderCommodity((ex?.['commodity'] as CommodityTypeTrade | undefined) ?? 'OIL'),
  });
  useFormDraft('trade-item', { form: itemForm, open: itemOpen, setOpen: setItemOpen, editing: editingItem, setEditing: setEditingItem });

  function openNewTrade() {
    setEditingTrade(null);
    setTradeCommodity('OIL');
    tradeForm.resetFields();
    tradeForm.setFieldsValue({
      commodityType: 'OIL', tradeType: 'PHYSICAL', direction: 'BUY',
      status: 'DRAFT', contractType: 'SPOT',
      termType: 'SPOT', dealIndicator: 'EXTERNAL',
      hedgeFlag: false, specialReference: null,
      instrumentType: null,
    });
    setTradeOpen(true);
  }
  function openEditTrade(t: Trade) {
    setEditingTrade(t);
    setTradeCommodity(t.commodityType);
    tradeForm.resetFields();
    tradeForm.setFieldsValue({
      ...t,
      tradeDate: t.tradeDate ? dayjs(t.tradeDate) : undefined,
      executionDatetime: t.executionDatetime ? dayjs(t.executionDatetime) : undefined,
      rfpStartDate: t.rfpStartDate ? dayjs(t.rfpStartDate) : undefined,
      rfpEndDate: t.rfpEndDate ? dayjs(t.rfpEndDate) : undefined,
    } as unknown as TradeInput);
    setTradeOpen(true);
  }
  async function submitTrade(closeAfter = true) {
    const values = await tradeForm.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: TradeInput = {
      ...(values as TradeInput),
      tradeDate: v.tradeDate ? v.tradeDate.format('YYYY-MM-DD') : (values as TradeInput).tradeDate,
      executionDatetime: v.executionDatetime ? v.executionDatetime.format('YYYY-MM-DDTHH:mm:ss[Z]') : null,
      rfpStartDate: v.rfpStartDate ? v.rfpStartDate.format('YYYY-MM-DD') : null,
      rfpEndDate: v.rfpEndDate ? v.rfpEndDate.format('YYYY-MM-DD') : null,
    };
    const saved = await saveTrade.mutateAsync({ id: editingTrade?.tradeId ?? null, input });
    if (closeAfter) setTradeOpen(false); else setEditingTrade(saved);
  }

  // ── Order / leg actions ──
  function openNewOrder() {
    if (!selectedTrade) return;
    setEditingOrder(null);
    setOrderCommodity(selectedTrade.commodityType);
    orderForm.resetFields();
    const defaultUom: Record<string, string> = { OIL: 'BBL', GAS: 'MWH', POWER: 'MWH', LNG: 'MMBTU', METALS: 'MT', AGRICULTURAL: 'MT', FREIGHT: 'MT', RINS: 'GAL', ENVIRONMENTAL: 'MT' };
    orderForm.setFieldsValue({
      tradeId: selectedTrade.tradeId,
      isTemplate: false,
      status: 'WORKING',
      settlementType: 'PHYSICAL',
      currencyCode: 'USD',
      uomCode: defaultUom[selectedTrade.commodityType] ?? 'BBL',
      toleranceForScheduling: false,
    });
    setOrderOpen(true);
  }
  function openEditOrder(o: TradeOrder) {
    setEditingOrder(o);
    if (selectedTrade) setOrderCommodity(selectedTrade.commodityType);
    orderForm.resetFields();
    const oilDetail = detailToForm(o.oilDetail, ['laycanStart', 'laycanEnd', 'blDate']);
    orderForm.setFieldsValue({
      ...o,
      oilDetail: oilDetail ? {
        ...oilDetail,
        norsTenderedDate: o.oilDetail?.norsTenderedDate ? dayjs(o.oilDetail.norsTenderedDate) : undefined,
      } : undefined,
      gasDetail:     detailToForm(o.gasDetail,     ['gasDeliveryStart', 'gasDeliveryEnd']),
      powerDetail:   detailToForm(o.powerDetail,   ['deliveryStart', 'deliveryEnd']),
      lngDetail:     o.lngDetail     ?? undefined,
      metalsDetail:  detailToForm(o.metalsDetail,  ['lmeDate']),
      agriDetail:    o.agriDetail    ?? undefined,
      freightDetail: detailToForm(o.freightDetail, ['laycanStart', 'laycanEnd']),
      tasDetail:     detailToForm(o.tasDetail,     ['tasSettlementDate']),
      balmoDetail:   detailToForm(o.balmoDetail,   ['pricingStartDate', 'pricingEndDate']),
      riskStartDate: o.riskStartDate ? dayjs(o.riskStartDate) : undefined,
      riskEndDate:   o.riskEndDate   ? dayjs(o.riskEndDate) : undefined,
    } as unknown as TradeOrderInput);
    setOrderOpen(true);
  }
  async function submitOrder(closeAfter = true) {
    const values = await orderForm.validateFields();
    const v = values as unknown as Record<string, unknown>;
    const riskStartDate = v.riskStartDate as Dayjs | undefined;
    const riskEndDate = v.riskEndDate as Dayjs | undefined;
    const rawOilDetail = v.oilDetail as { norsTenderedDate?: Dayjs } | undefined;
    const oilDetail = detailFromForm(values.oilDetail, ['laycanStart', 'laycanEnd', 'blDate']);
    const input = {
      ...values,
      oilDetail: oilDetail ? {
        ...oilDetail,
        norsTenderedDate: rawOilDetail?.norsTenderedDate
          ? rawOilDetail.norsTenderedDate.format('YYYY-MM-DDTHH:mm')
          : (values.oilDetail?.norsTenderedDate ?? null),
      } : values.oilDetail,
      gasDetail:     detailFromForm(values.gasDetail,     ['gasDeliveryStart', 'gasDeliveryEnd']),
      powerDetail:   detailFromForm(values.powerDetail,   ['deliveryStart', 'deliveryEnd']),
      metalsDetail:  detailFromForm(values.metalsDetail,  ['lmeDate']),
      freightDetail: detailFromForm(values.freightDetail, ['laycanStart', 'laycanEnd']),
      balmoDetail:   detailFromForm(values.balmoDetail,   ['pricingStartDate', 'pricingEndDate']),
      tasDetail:     detailFromForm(values.tasDetail,     ['tasSettlementDate']),
      riskStartDate: riskStartDate ? riskStartDate.format('YYYY-MM-DD') : values.riskStartDate,
      riskEndDate: riskEndDate ? riskEndDate.format('YYYY-MM-DD') : values.riskEndDate,
    } as unknown as TradeOrderInput;
    const saved = await saveOrder.mutateAsync({ id: editingOrder?.orderId ?? null, input });
    if (closeAfter) setOrderOpen(false); else setEditingOrder(saved);
  }

  // ── Item actions ──
  function openNewItem() {
    setEditingItem(null);
    itemForm.resetFields();
    itemForm.setFieldsValue({ orderId: selectedOrderId ?? 0, currencyCode: 'USD' });
    setItemOpen(true);
  }
  function openEditItem(item: TradeItem) {
    setEditingItem(item);
    itemForm.setFieldsValue({ ...item });
    setItemOpen(true);
  }
  async function submitItem(closeAfter = true) {
    const values = await itemForm.validateFields();
    const saved = await saveItem.mutateAsync({ id: editingItem?.itemId ?? null, input: values as TradeItemInput });
    if (closeAfter) setItemOpen(false); else setEditingItem(saved);
  }

  // ── Trade grid columns ──
  const tradeColDefs = useMemo<ColDef<Trade>[]>(() => [
    {
      field: 'tradeReference', headerName: 'Reference', width: 170, pinned: 'left', cellClass: 'cell-mono',
      cellRenderer: (p: { value: string; data: Trade }) => (
        <span style={{ fontWeight: 600, cursor: 'pointer', color: selectedTradeId === p.data?.tradeId ? '#1677ff' : undefined }}>
          {p.value}
        </span>
      ),
    },
    { field: 'tradeDate', headerName: 'Date', width: 100, cellClass: 'cell-mono' },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 160 },
    { field: 'traderCode', headerName: 'Trader', width: 72, cellClass: 'cell-mono' },
    {
      field: 'commodityType', headerName: 'Commodity', width: 105,
      cellRenderer: (p: { value: string }) => <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      field: 'tradeType', headerName: 'Type', width: 90,
      cellRenderer: (p: { value: string }) => <Tag color={TRADE_TYPE_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      field: 'direction', headerName: 'B/S', width: 58,
      cellRenderer: (p: { value: string }) => <Tag color={DIRECTION_COLOR[p.value]} style={{ fontWeight: 700 }}>{p.value}</Tag>,
    },
    {
      field: 'termType', headerName: 'Term', width: 72,
      cellRenderer: (p: { value: string }) => (
        <Tag color={p.value === 'RFP' ? 'geekblue' : 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>
      ),
    },
    {
      field: 'dealIndicator', headerName: 'Deal', width: 90,
      cellRenderer: (p: { value: string }) => (
        <Tag color={p.value === 'INTERNAL' ? 'purple' : 'cyan'} icon={<TagOutlined />} style={{ fontSize: 10 }}>{p.value}</Tag>
      ),
    },
    { field: 'contractNumber', headerName: 'Contract #', width: 140, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'orderCount', headerName: 'Legs', width: 58,
      cellRenderer: (p: { value: number }) => (
        <Tag color={p.value > 1 ? 'geekblue' : 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>
      ),
    },
    { field: 'brokerName', headerName: 'Broker', width: 120, valueFormatter: (p) => p.value ?? '—', cellStyle: { fontSize: 11, color: '#6b7280' } },
    {
      field: 'creditApprovalStatus', headerName: 'Credit', width: 88,
      cellRenderer: (p: { value: string | null }) => {
        const COLOR: Record<string, string> = { APPROVED: 'success', PENDING: 'warning', REJECTED: 'error', EXEMPT: 'default' };
        return p.value
          ? <Tag color={COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>
          : <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>;
      },
    },
    {
      field: 'status', headerName: 'Status', width: 100,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      headerName: '', width: 115, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Trade }) => (
        <Space size={2}>
          <Tooltip title="Edit Trade"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditTrade(p.data)} /></Tooltip>
          {p.data.status === 'DRAFT' && (
            <Tooltip title="Confirm Trade">
              <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#22c55e' }} onClick={() => confirmTrade.mutate(p.data.tradeId)} />
            </Tooltip>
          )}
          {(p.data.status === 'DRAFT' || p.data.status === 'CONFIRMED') && (
            <Popconfirm title="Cancel trade?" description={`${p.data.tradeReference} will be CANCELLED.`} onConfirm={() => cancelTrade.mutate(p.data.tradeId)} okText="Cancel Trade" okButtonProps={{ danger: true }}>
              <Tooltip title="Cancel Trade"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [cancelTrade, confirmTrade, selectedTradeId]);

  // ── Legs grid columns ──
  const orderColDefs = useMemo<ColDef<TradeOrder>[]>(() => [
    {
      headerName: '', width: 95, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: { data: TradeOrder }) => (
        p.data.isTemplate
          ? <Tag color="purple" style={{ fontSize: 10, margin: 0 }}>TEMPLATE</Tag>
          : <Tag color="default" style={{ fontSize: 10, margin: 0 }}>Leg {p.data.orderSequence}</Tag>
      ),
    },
    { field: 'orderReference', headerName: 'Leg Ref', width: 175, cellClass: 'cell-mono' },
    { field: 'periodCode', headerName: 'Period', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'productCode', headerName: 'Product', width: 125, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Qty / UoM', width: 130,
      valueGetter: (p) => `${Number(p.data?.quantity ?? 0).toLocaleString()} ${p.data?.uomCode ?? ''}`,
      cellStyle: { fontFamily: 'monospace', fontSize: 11 },
    },
    {
      headerName: 'Price', width: 115,
      valueGetter: (p) => p.data?.price != null ? `${p.data.currencyCode} ${Number(p.data.price).toFixed(2)}` : 'TBD',
      cellStyle: { fontFamily: 'monospace', fontSize: 11 },
    },
    {
      headerName: 'Risk Period', width: 190,
      valueGetter: (p) => {
        const s = p.data?.riskStartDate, e = p.data?.riskEndDate;
        return s && e ? `${s} → ${e}` : '—';
      },
      cellStyle: { fontSize: 11, fontFamily: 'monospace' },
    },
    {
      field: 'status', headerName: 'Status', width: 100,
      cellRenderer: (p: { value: string }) => <Tag color={ORDER_STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>,
    },
    {
      headerName: 'Actions', width: 155, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: TradeOrder }) => (
        <Space size={2}>
          <Tooltip title="Edit Leg"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditOrder(p.data)} /></Tooltip>
          <Button
            type="text" size="small"
            icon={<UnorderedListOutlined />}
            style={{ color: selectedOrderId === p.data.orderId ? '#1677ff' : undefined }}
            onClick={() => setSelectedOrderId((prev) => (prev === p.data.orderId ? null : p.data.orderId))}
          >
            <span style={{ fontSize: 11 }}>Items</span>
          </Button>
          {p.data.status === 'WORKING' && (
            <Tooltip title="Confirm Leg">
              <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#22c55e' }} onClick={() => confirmOrder.mutate({ id: p.data.orderId, tradeId: p.data.tradeId })} />
            </Tooltip>
          )}
          {(p.data.status === 'WORKING' || p.data.status === 'CONFIRMED') && (
            <Popconfirm title="Cancel leg?" onConfirm={() => cancelOrder.mutate({ id: p.data.orderId, tradeId: p.data.tradeId })} okText="Cancel" okButtonProps={{ danger: true }}>
              <Tooltip title="Cancel Leg"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [cancelOrder, confirmOrder, selectedOrderId]);

  // ── Items table columns ──
  const itemColumns = [
    { title: 'Seq', dataIndex: 'itemSequence', width: 50 },
    { title: 'Product', dataIndex: 'productCode', width: 120, render: (v: string | null) => v ?? <span style={{ color: '#9ca3af' }}>—</span> },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
    { title: 'Qty', dataIndex: 'quantity', width: 90, render: (v: number) => v.toLocaleString() },
    { title: 'UoM', dataIndex: 'uomCode', width: 65 },
    { title: 'Unit Price', dataIndex: 'unitPrice', width: 90, render: (v: number | null) => v != null ? v.toFixed(4) : '—' },
    { title: 'CCY', dataIndex: 'currencyCode', width: 60 },
    {
      title: '', width: 75,
      render: (_: unknown, record: TradeItem) => (
        <Space size={2}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditItem(record)} /></Tooltip>
          <Popconfirm title="Delete item?" onConfirm={() => deleteItem.mutate({ id: record.itemId, orderId: record.orderId })} okText="Delete" okButtonProps={{ danger: true }}>
            <Tooltip title="Delete"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <PageHeader
        title="Trade Blotter"
        description="Trade capture: header fields (counterparty, term type, deal indicator) apply to all legs. Click a trade to view and add delivery legs with product, pricing and commodity detail."
        moduleGroup="trade"
      />

      {/* ── Trade master grid — fixed height so legs panel is always visible ── */}
      <SmartGrid
        columnDefs={tradeColDefs}
        rowData={trades}
        loading={tradesLoading}
        height={360}
        onAdd={openNewTrade}
        addLabel="New Trade"
        onRefresh={() => { void refetch(); }}
        commodityFilter
        getRowId={(p) => String(p.data.tradeId)}
        onRowClicked={(e) => {
          const id = (e.data as Trade).tradeId;
          setSelectedTradeId((prev) => (prev === id ? null : id));
          setSelectedOrderId(null);
        }}
        getRowStyle={(p) => (p.data as Trade).tradeId === selectedTradeId ? { background: 'rgba(22,119,255,0.06)' } : undefined}
      />

      {/* ── Legs panel ── */}
      <Card
        size="small"
        style={{ marginTop: 16, border: selectedTrade ? '1px solid rgba(22,119,255,0.25)' : undefined }}
        styles={{ body: { padding: '8px 12px 12px' } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {selectedTrade ? (
              <Space size={6}>
                <Text strong style={{ fontSize: 13 }}>Delivery Legs</Text>
                <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>{selectedTrade.tradeReference}</Text>
                <Tag color={COMMODITY_COLOR[selectedTrade.commodityType]} style={{ margin: 0 }}>{selectedTrade.commodityType}</Tag>
                <Tag color={DIRECTION_COLOR[selectedTrade.direction]} style={{ fontWeight: 700, margin: 0 }}>{selectedTrade.direction}</Tag>
                <Tag color={TRADE_TYPE_COLOR[selectedTrade.tradeType]} style={{ margin: 0 }}>{selectedTrade.tradeType}</Tag>
                {selectedTrade.termType === 'RFP' && <Tag color="geekblue" style={{ margin: 0 }}>RFP</Tag>}
                {selectedTrade.dealIndicator === 'INTERNAL' && <Tag color="purple" style={{ margin: 0 }}>INTERNAL</Tag>}
                <Text type="secondary" style={{ fontSize: 11 }}>{selectedTrade.counterpartyName}</Text>
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>Delivery Legs — click a trade row above to load its legs</Text>
            )}
            {selectedTrade && (
              <Button size="small" type="primary" ghost icon={<PlusOutlined />} onClick={openNewOrder}>
                Add Leg
              </Button>
            )}
          </div>
        }
      >
        {selectedTrade ? (
          <SmartGrid
            columnDefs={orderColDefs}
            rowData={orders}
            loading={ordersLoading}
            height={260}
            getRowId={(p) => String(p.data.orderId)}
            onRowClicked={(e) => {
              const id = (e.data as TradeOrder).orderId;
              setSelectedOrderId((prev) => (prev === id ? null : id));
            }}
            getRowStyle={(p) => (p.data as TradeOrder).orderId === selectedOrderId ? { background: 'rgba(22,119,255,0.05)' } : undefined}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Select a trade to view its delivery legs"
            style={{ margin: '20px 0' }}
          />
        )}

        {/* ── Items panel ── */}
        {selectedOrderId !== null && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <Space>
                <Text strong style={{ fontSize: 12 }}>
                  Items — {orders.find((o) => o.orderId === selectedOrderId)?.orderReference ?? `Leg #${selectedOrderId}`}
                </Text>
                <Badge count={items.length} showZero style={{ backgroundColor: items.length ? '#1677ff' : '#d9d9d9' }} />
              </Space>
              <Button size="small" icon={<PlusOutlined />} onClick={openNewItem}>Add Item</Button>
            </div>
            {items.length === 0
              ? <Alert type="info" style={{ fontSize: 12 }} message="No items yet — items are optional sub-lines (multiple products, pricing components, partial shipments)." />
              : <Table columns={itemColumns} dataSource={items} rowKey="itemId" size="small" pagination={false} style={{ fontSize: 12 }} />
            }
          </div>
        )}
      </Card>

      {/* ══ TRADE DRAWER — header-only fields ══════════════════════════════════ */}
      <Drawer mask={false} forceRender
        title={<Space><SwapOutlined />{editingTrade ? `Edit Trade — ${editingTrade.tradeReference}` : 'New Trade'}</Space>}
        open={tradeOpen}
        onClose={() => setTradeOpen(false)}
        width={fullDrawerWidth}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setTradeOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submitTrade(false); }} loading={saveTrade.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submitTrade(true); }} loading={saveTrade.isPending}>
              {editingTrade ? 'Update & Close' : 'Create & Close'}
            </Button>
          </Space>
        }
      >
        <Form form={tradeForm} layout="vertical" size="small">

          {/* Commodity picker */}
          <Card size="small" style={{ marginBottom: 12, background: 'rgba(0,0,0,0.02)' }}>
            <Form.Item name="commodityType" label="Commodity Type" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
              <Segmented
                options={COMMODITY_TYPES_TRADE.map((c) => ({ value: c, label: c }))}
                onChange={(v) => {
                  const ct = v as CommodityTypeTrade;
                  setTradeCommodity(ct);
                  // clear instrumentType if it's no longer valid for the new commodity
                  const current = tradeForm.getFieldValue('instrumentType') as string | null;
                  if (current && !commodityInstrumentMap?.[ct]?.includes(current as never)) {
                    tradeForm.setFieldValue('instrumentType', null);
                  }
                }}
              />
            </Form.Item>
          </Card>

          {/* Two-column layout: identification & classification left, parties & credit right */}
          <Row gutter={28}>
          <Col span={12} style={{ borderRight: '1px solid rgba(125,125,125,0.15)' }}>

          {sectionTitle('Trade Identification')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tradeDate" label={hint('Trade Date', 'Date the deal was agreed.')} rules={[{ required: true }]}>
                <AppDatePicker />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tradeType" label={hint('Trade Type', 'PHYSICAL = delivery. FINANCIAL = cash-settled. OPTION = right not obligation.')} rules={[{ required: true }]}>
                <Select options={TRADE_TYPES.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="direction" label={hint('Direction', 'BUY = long. SELL = short.')} rules={[{ required: true }]}>
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
              <Form.Item name="contractNumber" label={hint('Contract Number', 'External or counterparty contract reference (e.g. CP deal number).')}>
                <Input placeholder="SHE-2026-OIL-4421" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="executionDatetime" label="Execution Time">
                <AppDatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
              </Form.Item>
            </Col>
          </Row>

          {sectionTitle('Deal Classification')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="termType" label={hint('Term Type', 'SPOT = single delivery leg. RFP = multi-period request for proposal with recurring legs.')} rules={[{ required: true }]}>
                <Segmented options={TERM_TYPES.map((t) => ({ value: t, label: t }))} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="dealIndicator" label={hint('Deal Indicator', 'INTERNAL = intra-group trade between related entities. Auto-populated from counterparty type.')} rules={[{ required: true }]}>
                <Select options={DEAL_INDICATORS.map((d) => ({ value: d, label: d }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractType" label={hint('Contract Type', 'SPOT = single event. MONTHLY / QUARTERLY = recurring profile.')}>
                <Select options={CONTRACT_TYPES.map((c) => ({ value: c, label: c }))} placeholder="SPOT" allowClear />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="instrumentType" label={hint('Instrument Type', 'Financial structure of the deal — PHYSICAL, FUTURES, FORWARD, SWAP (Fixed/Float or Float/Float), OPTION (Listed/OTC American/Asian/European), STORAGE_AGREEMENT, or TRANSPORT_AGREEMENT. Drives which detail panels appear on the leg.')}>
                <Select
                  allowClear
                  placeholder="Select instrument type (optional)"
                  options={(() => {
                    const allowed = new Set(commodityInstrumentMap?.[tradeCommodity] ?? INSTRUMENT_TYPES);
                    const filter = (v: string) => allowed.has(v as never);
                    const groups = [
                      { label: 'Physical & Forwards', items: [
                        { value: 'PHYSICAL',              label: 'Physical Delivery' },
                        { value: 'CERTIFICATE_TRANSFER',  label: 'Certificate Transfer (Spot)' },
                        { value: 'FORWARD',               label: 'Forward (OTC)' },
                        { value: 'FUTURES',               label: 'Futures (Exchange)' },
                      ]},
                      { label: 'Swaps', items: [
                        { value: 'SWAP_FIXED_FLOAT',  label: 'Swap — Fixed / Float' },
                        { value: 'SWAP_FLOAT_FLOAT',  label: 'Swap — Float / Float (Basis)' },
                      ]},
                      { label: 'Options', items: [
                        { value: 'OPTION_LISTED',       label: 'Option — Listed (Exchange)' },
                        { value: 'OPTION_OTC_AMERICAN', label: 'Option — OTC American' },
                        { value: 'OPTION_OTC_ASIAN',    label: 'Option — OTC Asian (APO)' },
                        { value: 'OPTION_OTC_EUROPEAN', label: 'Option — OTC European' },
                      ]},
                      { label: 'Agreement Deals', items: [
                        { value: 'STORAGE_AGREEMENT',   label: 'Storage Agreement' },
                        { value: 'TRANSPORT_AGREEMENT', label: 'Transport Agreement' },
                      ]},
                    ];
                    return groups
                      .map(g => ({ label: g.label, options: g.items.filter(i => filter(i.value)) }))
                      .filter(g => g.options.length > 0);
                  })()}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              {(watchedInstrumentType === 'SWAP_FIXED_FLOAT' || watchedInstrumentType === 'SWAP_FLOAT_FLOAT') && (
                <Alert type="info" showIcon style={{ marginTop: 29, fontSize: 11 }}
                  message={watchedInstrumentType === 'SWAP_FIXED_FLOAT' ? 'Swap: Fixed vs Floating index' : 'Basis Swap: two floating indices'} />
              )}
              {(watchedInstrumentType?.startsWith('OPTION_')) && (
                <Alert type="warning" showIcon style={{ marginTop: 29, fontSize: 11 }}
                  message={watchedInstrumentType === 'OPTION_OTC_ASIAN' ? 'APO: payoff = Avg(index) − Strike' : 'Option: strike, expiry, put/call, premium'} />
              )}
              {(watchedInstrumentType === 'STORAGE_AGREEMENT' || watchedInstrumentType === 'TRANSPORT_AGREEMENT') && (
                <Alert type="success" showIcon style={{ marginTop: 29, fontSize: 11 }}
                  message={watchedInstrumentType === 'STORAGE_AGREEMENT' ? 'Storage: capacity, tariff, in/out dates' : 'Transport: carrier, route, freight rate'} />
              )}
            </Col>
          </Row>

          {/* RFP fields — visible only when termType = RFP */}
          {watchedTermType === 'RFP' && (
            <Card size="small" style={{ marginBottom: 12, border: '1px solid #d3adf7', background: 'rgba(114,46,209,0.03)' }}>
              {sectionTitle('RFP Parameters')}
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="rfpMinQty" label={hint('Min Qty', 'Minimum total quantity buyer is obligated to take.')}>
                    <InputNumber placeholder="40000" style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="rfpMaxQty" label={hint('Max Qty', 'Maximum total quantity seller must make available.')}>
                    <InputNumber placeholder="60000" style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="rfpFrequency" label={hint('Frequency', 'How often legs auto-generate — DAILY, WEEKLY, MONTHLY, QUARTERLY.')}>
                    <Select options={RFP_FREQUENCIES.map((f) => ({ value: f, label: f }))} placeholder="MONTHLY" allowClear />
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="rfpStartDate" label="RFP Start Date">
                    <AppDatePicker />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="rfpEndDate" label="RFP End Date">
                    <AppDatePicker />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          </Col>
          <Col span={12}>

          {sectionTitle('Counterparty & Book')}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="counterpartyId" label={hint('Counterparty', 'The external party you are trading with. Determines deal indicator automatically.')} rules={[{ required: true }]}>
                <Select
                  options={(counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[]).map((cp) => ({ value: cp.counterpartyId, label: `${cp.counterpartyCode} — ${cp.name}` }))}
                  placeholder="Select counterparty" showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="legalEntityId" label={hint('Legal Entity', 'Your company entity — jurisdiction, currency, tax treatment.')} rules={[{ required: true }]}>
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
              <Form.Item name="bookId" label={hint('Book', 'Trading book for P&L attribution and position aggregation.')} rules={[{ required: true }]}>
                <Select
                  options={(books as { bookId: number; bookCode: string; bookName: string }[]).map((b) => ({ value: b.bookId, label: `${b.bookCode} — ${b.bookName}` }))}
                  placeholder="Select book" showSearch
                />
              </Form.Item>
            </Col>
          </Row>

          {sectionTitle('Broker')}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brokerId" label={hint('Broker', 'IDB that intermediated this trade. Leave blank for direct bilateral.')}>
                <Select options={brokerOpts} placeholder="Select broker (blank if direct)" allowClear showSearch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="brokerFeeType" label="Fee Type">
                <Select options={BROKER_FEE_TYPES.map((t) => ({ value: t, label: t }))} placeholder="FIXED / %" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="brokerFee" label="Broker Fee">
                <InputNumber precision={4} placeholder="0.02" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="brokerFeeCurrencyCode" label="Fee Currency">
                <Select options={currencyOpts} showSearch allowClear placeholder="USD" />
              </Form.Item>
            </Col>
          </Row>

          {sectionTitle('Credit & Legal')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="creditTermCode" label={hint('Credit Terms', 'NET_30 = 30 days after invoice. PREPAY = before delivery.')}>
                <Select options={CREDIT_TERM_CODES.map((c) => ({ value: c, label: c.replace('_', ' ') }))} placeholder="NET_30" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="creditApprovalStatus" label="Credit Approval">
                <Select options={CREDIT_APPROVAL_STATUSES.map((s) => ({ value: s, label: s }))} placeholder="PENDING" allowClear />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="creditLimitUsed" label={hint('Credit Limit Used', 'Notional credit exposure consumed by this deal.')}>
                <InputNumber style={{ width: '100%' }} placeholder="0.00" precision={2} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="gtcReference" label={hint('Legal GTC', 'EFET-GAS-2002, ISDA-2002, GTMA, BIMCO-GENCON-94.')}>
                <Input placeholder="EFET-GAS-2002" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>

          </Col>
          </Row>

          {sectionTitle('Contract Controls')}
          <Row gutter={16}>
            <Col span={4}>
              <Form.Item name="cin" label={hint('CIN', 'Contract Identification Number — internal reference used for regulatory reporting and amendment tracking.')}>
                <Input placeholder="CIN-2026-0001" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="contractPeriodicity" label={hint('Periodicity', 'For term contracts — how often delivery legs repeat.')}>
                <Select options={CONTRACT_PERIODICITIES.map((p) => ({ value: p, label: p }))} allowClear placeholder="MONTHLY" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="contractStatus" label={hint('Contract Status', 'ACTIVE = in force. SUSPENDED = temporarily halted. TERMINATED = cancelled with final settlement.')}>
                <Select options={CONTRACT_DEAL_STATUSES.map((s) => ({ value: s, label: s }))} allowClear placeholder="ACTIVE" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="paymentCalendarCode" label={hint('Payment Calendar', 'Holiday calendar code used to calculate payment due dates (e.g. LON-USD, NY-USD).')}>
                <Input placeholder="LON-USD" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={2}>
              <Form.Item name="hedgeFlag" label={hint('Hedge', 'Mark as accounting hedge under IAS 39 / IFRS 9. Required for hedge effectiveness testing.')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="specialReference" label={hint('Special Reference', 'Special contract reference — side letters, bespoke terms, non-standard clauses. Flags the deal for legal review. Max 180 characters.')}>
                <Input placeholder="e.g. Side letter 2026-04: BWAVE pricing override" maxLength={180} showCount />
              </Form.Item>
            </Col>
          </Row>

          {fp.canView('notes') && sectionTitle('Notes')}
          {fp.canView('notes') && (
            <Form.Item name="notes">
              <Input.TextArea rows={3} placeholder="Trade notes, special conditions, internal comments..." />
            </Form.Item>
          )}
        </Form>
      </Drawer>

      {/* ══ LEG DRAWER — all delivery detail ════════════════════════════════════ */}
      <Drawer mask={false} forceRender
        title={
          <Space>
            <SwapOutlined />
            {editingOrder
              ? `Edit Leg — ${editingOrder.orderReference}${editingOrder.isTemplate ? ' (TEMPLATE)' : ''}`
              : `New Leg — ${selectedTrade?.tradeReference ?? ''}`}
          </Space>
        }
        open={orderOpen}
        onClose={() => setOrderOpen(false)}
        width={fullDrawerWidth}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOrderOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submitOrder(false); }} loading={saveOrder.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submitOrder(true); }} loading={saveOrder.isPending}>
              {editingOrder ? 'Update & Close' : 'Add & Close'}
            </Button>
          </Space>
        }
      >
        <Form form={orderForm} layout="vertical" size="small">
          <Form.Item name="tradeId" hidden><Input /></Form.Item>

          {sectionTitle('Leg Identity')}
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="status" label="Leg Status" rules={[{ required: true }]}>
                <Select options={ORDER_STATUSES.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isTemplate" label={hint('Template Leg', 'Leg #1 is the template. Subsequent legs inherit its product, pricing rule and settlement type.')}>
                <Select options={[{ value: true, label: 'Yes — Template Leg' }, { value: false, label: 'No — Detail Leg' }]} />
              </Form.Item>
            </Col>
          </Row>

          <DeliveryFields commodityType={orderCommodity} {...deliveryFieldProps} isTas={isTasPricing} isBalmo={isBalmoPricing} />

          {sectionTitle('Tolerance')}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="toleranceType" label={hint('Tolerance Type', 'RATE = percentage of contracted qty. FLAT = fixed absolute volume above/below contract qty.')}>
                <Select options={TOLERANCE_TYPES.map((t) => ({ value: t, label: t === 'RATE' ? 'RATE (%)' : 'FLAT (volume)' }))} allowClear placeholder="None" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="tolerancePlus" label={hint('+Tolerance', 'Maximum overdelivery — % if RATE, absolute volume if FLAT. e.g. 5% or 25,000 BBL.')}>
                <InputNumber
                  placeholder={watchedToleranceType === 'RATE' ? '5' : '25000'}
                  precision={watchedToleranceType === 'RATE' ? 2 : 0}
                  suffix={watchedToleranceType === 'RATE' ? '%' : undefined}
                  style={{ width: '100%' }}
                  formatter={(v) => watchedToleranceType !== 'RATE' ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(v ?? '')}
                  parser={(v) => v?.replace(/,/g, '') as unknown as number}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="toleranceMinus" label={hint('−Tolerance', 'Maximum underdelivery — % if RATE, absolute volume if FLAT.')}>
                <InputNumber
                  placeholder={watchedToleranceType === 'RATE' ? '5' : '25000'}
                  precision={watchedToleranceType === 'RATE' ? 2 : 0}
                  suffix={watchedToleranceType === 'RATE' ? '%' : undefined}
                  style={{ width: '100%' }}
                  formatter={(v) => watchedToleranceType !== 'RATE' ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : String(v ?? '')}
                  parser={(v) => v?.replace(/,/g, '') as unknown as number}
                />
              </Form.Item>
            </Col>
            {watchedToleranceType && (
              <Col span={6}>
                <Form.Item
                  name="toleranceForScheduling"
                  label={hint('Apply to Scheduling', 'ON = schedulable qty can exceed contract qty by tolerance. Risk position always uses contract qty only — tolerance never affects risk.')}
                  valuePropName="checked"
                >
                  <Switch />
                </Form.Item>
              </Col>
            )}
          </Row>

          {sectionTitle('Notes')}
          <Form.Item name="notes">
            <Input.TextArea rows={2} placeholder="Leg-level notes, special delivery conditions..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ══ ITEM DRAWER ══════════════════════════════════════════════════════════ */}
      <Drawer mask={false} forceRender
        title={editingItem ? `Edit Item #${editingItem.itemSequence}` : 'Add Item'}
        open={itemOpen}
        onClose={() => setItemOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setItemOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submitItem(false); }} loading={saveItem.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submitItem(true); }} loading={saveItem.isPending}>
              {editingItem ? 'Update Item' : 'Add Item'}
            </Button>
          </Space>
        }
      >
        <Form form={itemForm} layout="vertical" size="small">
          <Form.Item name="orderId" hidden><Input /></Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="productId" label="Product">
                <Select
                  options={(products as { productId: number; productCode: string; productName: string }[]).map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` }))}
                  placeholder="Select product" showSearch allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Description" rules={[{ required: true }]}>
            <Input placeholder="e.g. Main cargo, Operational tolerance, Pricing component" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={7}><Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}><InputNumber placeholder="500000" style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} /></Form.Item></Col>
            <Col span={5}><Form.Item name="uomCode" label="UoM" rules={[{ required: true }]}><Select options={uomOpts} showSearch /></Form.Item></Col>
            <Col span={7}><Form.Item name="unitPrice" label="Unit Price"><InputNumber placeholder="82.45" precision={4} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={5}><Form.Item name="currencyCode" label="CCY" rules={[{ required: true }]}><Select options={currencyOpts} showSearch /></Form.Item></Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Item notes..." />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
