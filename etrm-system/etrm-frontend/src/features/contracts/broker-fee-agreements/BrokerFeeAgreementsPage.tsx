import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select,
  Switch, InputNumber, Divider, Typography, Tooltip,
} from 'antd';
import { EditOutlined, StopOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useBrokers } from '@features/organization/brokers/hooks';
import { useProducts } from '@features/markets/products/hooks';
import { type CommodityRow, resolveCommodityType } from '@features/markets/products/types';
import { useBrokerFeeAgreements, useSaveBrokerFeeAgreement, useDeactivateBrokerFeeAgreement } from './hooks';
import {
  FEE_TYPES, PAY_PERIODS, BFA_COMMODITY_TYPES,
  FEE_TYPE_META, PAY_PERIOD_LABELS,
  type BrokerFeeAgreement, type BrokerFeeAgreementInput, type FeeType, type PayPeriod,
} from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { useTableRows } from '@features/tier2/hooks';
import { useUom } from '@features/reference/uom/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';

const { Text } = Typography;

const TRADE_TYPES = ['PHYSICAL', 'FINANCIAL'] as const;

function formatRate(row: BrokerFeeAgreement): string {
  const n = Number(row.feeRate);
  switch (row.feeType) {
    case 'PER_LOT':        return `${row.feeCurrencyCode} ${n.toFixed(4)} / ${row.uomCode ?? '—'}`;
    case 'PCT_NOTIONAL':   return `${(n * 100).toFixed(4)}%`;
    case 'FLAT_PER_TRADE': return `${row.feeCurrencyCode} ${n.toLocaleString(undefined, { minimumFractionDigits: 0 })} / trade`;
    case 'FLAT_MONTHLY':   return `${row.feeCurrencyCode} ${n.toLocaleString(undefined, { minimumFractionDigits: 0 })} / month`;
    default:               return String(n);
  }
}

const COMMODITY_COLORS: Record<string, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', LNG: 'cyan',
  METALS: 'purple', AGRICULTURAL: 'green', FREIGHT: 'geekblue',
};

export function BrokerFeeAgreementsPage() {
  const { data, isLoading, refetch } = useBrokerFeeAgreements();
  const save = useSaveBrokerFeeAgreement();
  const deactivate = useDeactivateBrokerFeeAgreement();
  const { data: brokers = [] } = useBrokers();
  const { data: products = [] } = useProducts();
  const { data: uoms = [] } = useUom();
  const uomOptions = useMemo(() => uoms.map((u) => ({ value: u.uomId, label: u.uomCode })), [uoms]);
  const { data: currencies = [] } = useCurrencies();
  const currencyOptions = useMemo(
    () => currencies.map((c) => ({ value: c.currencyId, label: `${c.currencyCode} — ${c.currencyName}` })),
    [currencies],
  );

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BrokerFeeAgreement | null>(null);
  const [selectedCommodity, setSelectedCommodity] = useState<string | null>(null);
  const [selectedFeeType, setSelectedFeeType] = useState<FeeType>('PER_LOT');
  const [form] = Form.useForm<BrokerFeeAgreementInput>();
  useFormDraft('contracts-bfa', { form, open, setOpen, editing, setEditing });

  const { data: commodityRows = [] } = useTableRows('commodity');
  const commodities = commodityRows as CommodityRow[];

  const filteredProducts = useMemo(
    () => products.filter((p) => !selectedCommodity || resolveCommodityType(commodities, p.commodityId) === selectedCommodity),
    [products, commodities, selectedCommodity],
  );

  function openNew() {
    setEditing(null);
    setSelectedCommodity(null);
    setSelectedFeeType('PER_LOT');
    form.resetFields();
    form.setFieldsValue({ feeType: 'PER_LOT', feeCurrencyId: 1, payPeriod: 'MONTHLY', paymentDueDays: 30, isActive: true });
    setOpen(true);
  }

  function openEdit(row: BrokerFeeAgreement) {
    setEditing(row);
    setSelectedCommodity(row.commodityType);
    setSelectedFeeType(row.feeType);
    form.setFieldsValue({
      brokerId:         row.brokerId,
      agreementCode:    row.agreementCode,
      description:      row.description ?? undefined,
      commodityType:    row.commodityType ?? undefined,
      productId:        row.productId ?? undefined,
      tradeType:        row.tradeType ?? undefined,
      feeType:          row.feeType,
      feeRate:          row.feeRate,
      feeCurrencyId:    row.feeCurrencyId,
      uomId:            row.uomId ?? undefined,
      payPeriod:        row.payPeriod,
      paymentDueDays:   row.paymentDueDays,
      minimumFee:       row.minimumFee ?? undefined,
      maximumFee:       row.maximumFee ?? undefined,
      effectiveFrom:    row.effectiveFrom,
      effectiveTo:      row.effectiveTo ?? undefined,
      isActive:         row.isActive,
    });
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.agreementId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<BrokerFeeAgreement>[]>(() => [
    {
      field: 'agreementCode', headerName: 'Code', width: 160, pinned: 'left', cellClass: 'cell-mono',
      cellRenderer: (p: { value: string }) => (
        <Tag color="geekblue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.value}</Tag>
      ),
    },
    { field: 'brokerName', headerName: 'Broker', flex: 1, minWidth: 200, tooltipValueGetter: (p) => p.value },
    {
      field: 'commodityType', headerName: 'Commodity', width: 110,
      cellRenderer: (p: { value: string | null }) =>
        p.value
          ? <Tag color={COMMODITY_COLORS[p.value] ?? 'default'}>{p.value}</Tag>
          : <Text type="secondary" style={{ fontSize: 11 }}>All</Text>,
    },
    {
      field: 'productName', headerName: 'Product', flex: 1, minWidth: 160,
      valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: (p) => p.value,
      cellStyle: { fontSize: 12, color: '#6b7280' },
    },
    {
      field: 'tradeType', headerName: 'Trade Type', width: 100,
      cellRenderer: (p: { value: string | null }) =>
        p.value
          ? <Tag color={p.value === 'PHYSICAL' ? 'green' : 'blue'}>{p.value}</Tag>
          : <Text type="secondary" style={{ fontSize: 11 }}>Both</Text>,
    },
    {
      field: 'feeType', headerName: 'Fee Type', width: 120,
      cellRenderer: (p: { value: FeeType }) => (
        <Tag color={FEE_TYPE_META[p.value]?.color}>{FEE_TYPE_META[p.value]?.label}</Tag>
      ),
    },
    {
      headerName: 'Rate', width: 190,
      tooltipValueGetter: (p) => p.data ? formatRate(p.data) : '',
      cellRenderer: (p: { data: BrokerFeeAgreement }) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{formatRate(p.data)}</Text>
      ),
    },
    {
      field: 'payPeriod', headerName: 'Pay Period', width: 115,
      cellRenderer: (p: { value: PayPeriod }) => (
        <Tag color="default">{PAY_PERIOD_LABELS[p.value]}</Tag>
      ),
    },
    {
      headerName: 'Min / Max Fee', width: 160, sortable: false,
      cellRenderer: (p: { data: BrokerFeeAgreement }) => {
        const min = p.data.minimumFee;
        const max = p.data.maximumFee;
        if (!min && !max) return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        const parts: string[] = [];
        if (min) parts.push(`min ${p.data.feeCurrencyCode} ${Number(min).toLocaleString()}`);
        if (max) parts.push(`max ${p.data.feeCurrencyCode} ${Number(max).toLocaleString()}`);
        return <Text style={{ fontSize: 11 }}>{parts.join(' · ')}</Text>;
      },
    },
    { field: 'effectiveFrom', headerName: 'From',   width: 100, cellClass: 'cell-mono' },
    {
      field: 'effectiveTo',   headerName: 'To',     width: 100, cellClass: 'cell-mono',
      cellRenderer: (p: { value: string | null }) =>
        p.value
          ? <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.value}</span>
          : <Tag color="green" style={{ fontSize: 10 }}>Open</Tag>,
    },
    { field: 'isActive', headerName: 'Status', width: 85, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: BrokerFeeAgreement }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm
              title="Deactivate this agreement?"
              description="No fees will be auto-generated from this agreement after deactivation."
              onConfirm={() => deactivate.mutate(p.data.agreementId)}
              okText="Deactivate" okButtonProps={{ danger: true }}
            >
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
        title="Broker Fee Agreements"
        description="Standing rate cards per broker — defines fee type, rate, currency, pay period, and scope. The system uses these to auto-populate brokerage fees when a broker is selected on a trade."
        moduleGroup="contracts"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Agreement"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.agreementId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Agreement — ${editing.agreementCode}` : 'New Broker Fee Agreement'}
        open={open}
        onClose={() => setOpen(false)}
        width={560}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onValuesChange={(changed) => {
            if ('feeType' in changed)       setSelectedFeeType(changed.feeType as FeeType);
            if ('commodityType' in changed) {
              setSelectedCommodity(changed.commodityType ?? null);
              form.setFieldValue('productId', undefined);
            }
          }}
        >
          {/* ── Identity ─────────────────────────────────────────── */}
          <Form.Item
            name="brokerId"
            label={hint('Broker', 'The IDB this agreement applies to. Only active IDB brokers are shown.')}
            rules={[{ required: true, message: 'Select a broker' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Select broker"
              options={brokers
                .filter((b) => b.isActive)
                .map((b) => ({ value: b.brokerId, label: `${b.brokerCode} — ${b.brokerName}` }))}
            />
          </Form.Item>

          <Form.Item
            name="agreementCode"
            label={hint('Agreement Code', 'Unique reference code for this rate card. Convention: BROKER-COMMODITY-YEAR. e.g. ICAP-OIL-2026', 'ICAP-OIL-2026')}
            rules={[{ required: true, message: 'Agreement code is required' }]}
          >
            <Input placeholder="ICAP-OIL-2026" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Short description of what this rate covers — markets, products, any special terms." />
          </Form.Item>

          {/* ── Scope ────────────────────────────────────────────── */}
          <Divider style={{ margin: '12px 0' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Scope — which trades this rate applies to</Text>
          </Divider>

          <Space.Compact style={{ width: '100%', gap: 8, display: 'flex' }}>
            <Form.Item
              name="commodityType"
              label={hint('Commodity', 'Leave blank to apply this rate to all commodities traded with this broker.')}
              style={{ flex: 1 }}
            >
              <Select
                allowClear
                placeholder="All commodities"
                options={BFA_COMMODITY_TYPES.map((c) => ({ value: c, label: c }))}
              />
            </Form.Item>
            <Form.Item
              name="tradeType"
              label={hint('Trade Type', 'Leave blank to apply to both physical and financial trades.')}
              style={{ flex: 1 }}
            >
              <Select
                allowClear
                placeholder="Physical & Financial"
                options={TRADE_TYPES.map((t) => ({ value: t, label: t }))}
              />
            </Form.Item>
          </Space.Compact>

          <Form.Item
            name="productId"
            label={hint('Product', 'Leave blank to apply to all products in the selected commodity. Select a commodity first to filter the list.')}
          >
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={selectedCommodity ? `All ${selectedCommodity} products` : 'All products'}
              options={filteredProducts.map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` }))}
              disabled={filteredProducts.length === 0 && !selectedCommodity}
            />
          </Form.Item>

          {/* ── Fee Structure ─────────────────────────────────────── */}
          <Divider style={{ margin: '12px 0' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Fee structure</Text>
          </Divider>

          <Form.Item
            name="feeType"
            label="Fee Type"
            rules={[{ required: true }]}
          >
            <Select
              options={FEE_TYPES.map((t) => ({
                value: t,
                label: (
                  <Space size={6}>
                    <Tag color={FEE_TYPE_META[t].color} style={{ margin: 0 }}>{FEE_TYPE_META[t].label}</Tag>
                    <Text type="secondary" style={{ fontSize: 11 }}>{FEE_TYPE_META[t].hint.split('.')[0]}</Text>
                  </Space>
                ),
              }))}
            />
          </Form.Item>

          <Space style={{ width: '100%', gap: 8 }} align="start">
            <Form.Item
              name="feeRate"
              label={
                <span>
                  {FEE_TYPE_META[selectedFeeType]?.rateLabel ?? 'Rate'}
                  <Tooltip title={FEE_TYPE_META[selectedFeeType]?.hint}>
                    <InfoCircleOutlined style={{ marginLeft: 6, color: '#8c8c8c' }} />
                  </Tooltip>
                </span>
              }
              rules={[{ required: true, message: 'Enter a rate' }]}
              style={{ flex: 2 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={selectedFeeType === 'PCT_NOTIONAL' ? 6 : 2}
                step={selectedFeeType === 'PCT_NOTIONAL' ? 0.0001 : 0.01}
                placeholder={selectedFeeType === 'PCT_NOTIONAL' ? '0.0004 (= 0.04%)' : '0.02'}
              />
            </Form.Item>

            <Form.Item
              name="feeCurrencyId"
              label="Currency"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Select currency"
                options={currencyOptions}
              />
            </Form.Item>

            {selectedFeeType === 'PER_LOT' && (
              <Form.Item
                name="uomId"
                label={hint('UoM', 'Unit of measure the rate applies to.')}
                rules={[{ required: true, message: 'Select UoM for per-lot fee' }]}
                style={{ flex: 1 }}
              >
                <Select
                  placeholder="BBL"
                  showSearch
                  optionFilterProp="label"
                  options={uomOptions}
                />
              </Form.Item>
            )}
          </Space>

          {/* ── Invoicing ─────────────────────────────────────────── */}
          <Divider style={{ margin: '12px 0' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Invoicing</Text>
          </Divider>

          <Space style={{ width: '100%', gap: 8 }} align="start">
            <Form.Item
              name="payPeriod"
              label={hint('Pay Period', 'How often fees are invoiced. PER_TRADE = one invoice per trade (common for freight). MONTHLY = aggregate and invoice at month end.')}
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select options={PAY_PERIODS.map((p) => ({ value: p, label: PAY_PERIOD_LABELS[p] }))} />
            </Form.Item>
            <Form.Item
              name="paymentDueDays"
              label={hint('Due (days)', 'Days after period close that payment must be made. Standard is 30 days.')}
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} max={90} placeholder="30" />
            </Form.Item>
          </Space>

          <Space style={{ width: '100%', gap: 8 }} align="start">
            <Form.Item
              name="minimumFee"
              label={hint('Minimum Fee', 'Period floor — if accrued fees fall below this, the minimum is charged instead. Leave blank for no minimum.')}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 2000" prefix="$" />
            </Form.Item>
            <Form.Item
              name="maximumFee"
              label={hint('Maximum Fee', 'Period cap — fees will not exceed this amount per period regardless of volume. Leave blank for no cap.')}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} placeholder="e.g. 50000" prefix="$" />
            </Form.Item>
          </Space>

          {/* ── Validity ─────────────────────────────────────────── */}
          <Divider style={{ margin: '12px 0' }}>
            <Text type="secondary" style={{ fontSize: 11 }}>Validity period</Text>
          </Divider>

          <Space style={{ width: '100%', gap: 8 }} align="start">
            <Form.Item
              name="effectiveFrom"
              label={hint('Effective From', 'Date from which this rate applies to new trades. Trades before this date use a different (earlier) agreement.')}
              rules={[{ required: true, message: 'Effective from is required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder={dayjs().format('YYYY-MM-DD')} style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item
              name="effectiveTo"
              label={hint('Effective To', 'Last date this rate applies. Leave blank for an open-ended agreement that remains in force until deactivated.')}
              style={{ flex: 1 }}
            >
              <Input placeholder="Open-ended" style={{ fontFamily: 'monospace' }} />
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
