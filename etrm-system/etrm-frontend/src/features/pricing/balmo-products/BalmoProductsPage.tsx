import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, InputNumber, Row, Col } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useBalmoProducts, useSaveBalmoProduct } from './hooks';
import {
  BALMO_PRODUCT_EXCHANGES, BALMO_PRODUCT_SERIES, BALMO_PRODUCT_STATUSES, BALMO_PRICE_SOURCES,
  type BalmoProduct, type BalmoProductInput, type BalmoProductStatus,
} from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { AuditInfo } from '@components/smart/AuditInfo';
import dayjs, { type Dayjs } from 'dayjs';
import { useUom } from '@features/reference/uom/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';

const STATUS_COLOR: Record<BalmoProductStatus, string> = {
  ACTIVE: 'success', EXPIRED: 'default', SUSPENDED: 'warning',
};

export function BalmoProductsPage() {
  const { data = [], isLoading, refetch } = useBalmoProducts();
  const save = useSaveBalmoProduct();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BalmoProduct | null>(null);
  const [form] = Form.useForm<BalmoProductInput>();
  useFormDraft('pricing-balmo-products', { form, open, setOpen, editing, setEditing });
  const { data: uoms = [] } = useUom();
  const uomOptions = uoms.map((u) => ({ value: u.uomId, label: u.uomCode }));
  const { data: currencies = [] } = useCurrencies();
  const currencyOptions = currencies.map((c) => ({ value: c.currencyId, label: c.currencyCode }));

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', tickCurrencyId: 1, priceSource: 'CME', tickSize: 0.01 });
    setOpen(true);
  }
  function openEdit(r: BalmoProduct) {
    setEditing(r);
    form.resetFields();
    form.setFieldsValue({
      ...r,
      pricingStartDate: r.pricingStartDate ? dayjs(r.pricingStartDate) : undefined,
      pricingEndDate: r.pricingEndDate ? dayjs(r.pricingEndDate) : undefined,
      lastTradingDate: r.lastTradingDate ? dayjs(r.lastTradingDate) : undefined,
    } as unknown as BalmoProductInput);
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: BalmoProductInput = {
      ...values,
      pricingStartDate: v.pricingStartDate ? v.pricingStartDate.format('YYYY-MM-DD') : values.pricingStartDate,
      pricingEndDate: v.pricingEndDate ? v.pricingEndDate.format('YYYY-MM-DD') : values.pricingEndDate,
      lastTradingDate: v.lastTradingDate ? v.lastTradingDate.format('YYYY-MM-DD') : values.lastTradingDate,
    };
    const saved = await save.mutateAsync({ id: editing?.balmoProductId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<BalmoProduct>[]>(() => [
    { field: 'productCode', headerName: 'Code', width: 175, cellClass: 'cell-mono', pinned: 'left' },
    { field: 'productName', headerName: 'Product Name', flex: 1.5, minWidth: 220 },
    { field: 'exchange', headerName: 'Exchange', width: 120, cellClass: 'cell-mono' },
    { field: 'contractSeries', headerName: 'Series', width: 80, cellClass: 'cell-mono' },
    { field: 'contractMonth', headerName: 'Month', width: 100, cellClass: 'cell-mono' },
    {
      headerName: 'Pricing Window', width: 230,
      valueGetter: (p) => `${p.data?.pricingStartDate ?? '—'} → ${p.data?.pricingEndDate ?? '—'}`,
      cellStyle: { fontFamily: 'monospace', fontSize: 11 },
    },
    { field: 'settlementPriceTicker', headerName: 'Settle Ticker', width: 120, cellClass: 'cell-mono' },
    {
      headerName: 'Tick', width: 100,
      valueGetter: (p) => p.data ? `${p.data.tickSize} ${p.data.tickCurrency}` : '—',
      cellStyle: { fontFamily: 'monospace', fontSize: 11 },
    },
    { field: 'lastTradingDate', headerName: 'Last Trading', width: 120, cellClass: 'cell-mono' },
    {
      field: 'status', headerName: 'Status', width: 100,
      cellRenderer: (p: { value: BalmoProductStatus }) => (
        <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>
      ),
    },
    {
      headerName: '', width: 65, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: BalmoProduct }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="BALMO Products"
        description="Balance of Month contract listings — each row represents one monthly BALMO contract on CME NYMEX or ICE. New rows are added each month as contracts are listed. Pricing window = booking date → last business day of contract month."
        moduleGroup="pricing"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New BALMO Product"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.balmoProductId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit BALMO Product — ${editing.productCode}` : 'New BALMO Product'}
        open={open}
        onClose={() => setOpen(false)}
        width={600}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending} icon={<PlusOutlined />}>
              {editing ? 'Update & Close' : 'Create & Close'}
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="productCode" label={hint('Product Code', 'Unique code — convention: BALMO-{SERIES}-{YYYY}-{MM}. Example: BALMO-CL-2026-07.')} rules={[{ required: true }]}>
                <Input placeholder="BALMO-CL-2026-07" maxLength={30} showCount style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={BALMO_PRODUCT_STATUSES.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="productName" label="Product Name" rules={[{ required: true }]}>
            <Input placeholder="WTI Crude BALMO July 2026" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="exchange" label={hint('Exchange', 'CME NYMEX for WTI/NG/HO/RB. ICE Europe for Brent/Gasoil.')} rules={[{ required: true }]}>
                <Select options={BALMO_PRODUCT_EXCHANGES.map((e) => ({ value: e, label: e.replace(/_/g, ' ') }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractSeries" label={hint('Series', 'Futures family for daily settlement price. CL = WTI, BZ = Brent.')} rules={[{ required: true }]}>
                <Select options={BALMO_PRODUCT_SERIES.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="contractMonth" label={hint('Contract Month', 'Format: YYYY-MM. E.g. 2026-07 for July 2026.')} rules={[{ required: true }]}>
                <Input placeholder="2026-07" style={{ fontFamily: 'monospace' }} maxLength={7} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="pricingStartDate" label={hint('Pricing Start', 'First business day this contract prices from. For current month = today; future months = 1st business day of month.')} rules={[{ required: true }]}>
                <AppDatePicker />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="pricingEndDate" label={hint('Pricing End', 'Last business day of the contract month. All daily settlements up to and including this date are averaged.')} rules={[{ required: true }]}>
                <AppDatePicker />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="lastTradingDate" label={hint('Last Trading Date', 'Last day a BALMO trade can be executed for this month. Typically the last business day of the prior month on CME, or 1st business day of the contract month.')} rules={[{ required: true }]}>
                <AppDatePicker />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="settlementPriceTicker" label={hint('Settlement Ticker', 'Specific front-month futures contract ticker used for daily price averaging. Changes each month. E.g. CLN26 for July 2026 WTI BALMO.')} rules={[{ required: true }]}>
                <Input placeholder="CLN26" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} maxLength={8} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="tickSize" label="Tick Size" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} precision={6} step={0.001} placeholder="0.01" min={0.00001} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tickCurrencyId" label="Tick Currency" rules={[{ required: true }]}>
                <Select options={currencyOptions} showSearch optionFilterProp="label" placeholder="USD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="uomId" label="UoM" rules={[{ required: true }]}>
                <Select options={uomOptions} showSearch optionFilterProp="label" placeholder="BBL" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="priceSource" label={hint('Price Source', 'Where daily settlement prices are sourced from for the running average calculation.')} rules={[{ required: true }]}>
            <Select options={BALMO_PRICE_SOURCES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Notes on this BALMO contract listing..." />
          </Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} updatedAt={editing?.updatedAt} />
      </Drawer>
    </>
  );
}
