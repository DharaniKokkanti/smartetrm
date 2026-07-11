import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, InputNumber, Switch, Popconfirm, Tooltip } from 'antd';
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useSettlementPrices, useSaveSettlementPrice, useConfirmSettlementPrice } from './hooks';
import { TAS_EXCHANGES, SETTLEMENT_SOURCES, type SettlementPrice, type SettlementPriceInput, type TasExchange } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { useUom } from '@features/reference/uom/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';

const EXCHANGE_COLOR: Record<TasExchange, string> = {
  CME_NYMEX: 'blue', ICE_EUROPE: 'orange', ICE_US: 'cyan',
};

export function SettlementPricesPage() {
  const { data = [], isLoading, refetch } = useSettlementPrices();
  const save = useSaveSettlementPrice();
  const confirm = useConfirmSettlementPrice();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SettlementPrice | null>(null);
  const [form] = Form.useForm<SettlementPriceInput>();
  useFormDraft('pricing-settlement-prices', { form, open, setOpen, editing, setEditing });
  const { data: uoms = [] } = useUom();
  const uomOptions = uoms.map((u) => ({ value: u.uomId, label: u.uomCode }));
  const { data: currencies = [] } = useCurrencies();
  const currencyOptions = currencies.map((c) => ({ value: c.currencyId, label: c.currencyCode }));

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ tickCurrencyId: 1, isConfirmed: false, source: 'MANUAL' });
    setOpen(true);
  }
  function openEdit(r: SettlementPrice) {
    setEditing(r);
    form.setFieldsValue({
      exchange: r.exchange, contractTicker: r.contractTicker,
      settleDate: r.settleDate ? dayjs(r.settleDate) : undefined,
      settlePrice: r.settlePrice, tickSize: r.tickSize, tickCurrencyId: r.tickCurrencyId,
      uomId: r.uomId, isConfirmed: r.isConfirmed, source: r.source, notes: r.notes ?? undefined,
    } as unknown as SettlementPriceInput);
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: SettlementPriceInput = {
      ...values,
      settleDate: v.settleDate ? v.settleDate.format('YYYY-MM-DD') : values.settleDate,
    };
    const saved = await save.mutateAsync({ id: editing?.settlementPriceId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<SettlementPrice>[]>(() => [
    {
      field: 'exchange', headerName: 'Exchange', width: 130,
      cellRenderer: (p: { value: TasExchange }) => (
        <Tag color={EXCHANGE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>
      ),
    },
    { field: 'contractTicker', headerName: 'Ticker', width: 90, cellClass: 'cell-mono', pinned: 'left' },
    { field: 'settleDate', headerName: 'Settle Date', width: 110, cellClass: 'cell-mono' },
    {
      field: 'settlePrice', headerName: 'Settle Price', width: 120, cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? Number(p.value).toFixed(4) : '—',
    },
    { field: 'tickSize', headerName: 'Tick Size', width: 90, cellClass: 'cell-mono', valueFormatter: (p) => p.value?.toString() ?? '—' },
    { field: 'uomCode', headerName: 'UoM', width: 80, cellClass: 'cell-mono' },
    { field: 'source', headerName: 'Source', width: 80, cellClass: 'cell-mono' },
    {
      field: 'isConfirmed', headerName: 'Confirmed', width: 100,
      cellRenderer: (p: { value: boolean }) => (
        p.value
          ? <Tag color="success" style={{ fontSize: 10 }}>CONFIRMED</Tag>
          : <Tag color="warning" style={{ fontSize: 10 }}>PENDING</Tag>
      ),
    },
    { field: 'notes', headerName: 'Notes', flex: 1, valueFormatter: (p) => p.value ?? '—', cellStyle: { fontSize: 11, color: '#6b7280' } },
    {
      headerName: '', width: 105, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: SettlementPrice }) => (
        <Space size={2}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {!p.data.isConfirmed && (
            <Popconfirm title="Confirm settlement price?" description={`${p.data.contractTicker} ${p.data.settleDate} = ${p.data.settlePrice}`} onConfirm={() => confirm.mutate(p.data.settlementPriceId)} okText="Confirm" okButtonProps={{ icon: <CheckCircleOutlined /> }}>
              <Tooltip title="Confirm settlement">
                <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#22c55e' }} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [confirm]);

  return (
    <>
      <PageHeader
        title="Settlement Prices"
        description="Daily exchange settlement prices — CME NYMEX (CL, NG, HO, RB) and ICE (Brent BZ, Gasoil). Confirmed prices are used to lock TAS trade positions."
        moduleGroup="pricing"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="Add Settlement Price"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.settlementPriceId)}
        getRowStyle={(p) => !(p.data as SettlementPrice).isConfirmed ? { background: 'rgba(250,173,20,0.04)' } : undefined}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit — ${editing.contractTicker} ${editing.settleDate}` : 'Add Settlement Price'}
        open={open}
        onClose={() => setOpen(false)}
        width={520}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small">
          <Form.Item name="exchange" label={hint('Exchange', 'Exchange that publishes this settlement price.')} rules={[{ required: true }]}>
            <Select options={TAS_EXCHANGES.map((e) => ({ value: e, label: e.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="contractTicker" label={hint('Contract Ticker', 'Specific futures contract — e.g. CLZ26 (WTI Dec 2026). Format: 2-letter series + month code (F=Jan…Z=Dec) + 2-digit year.')} rules={[{ required: true }]} style={{ flex: 2 }}>
              <Input placeholder="CLZ26" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="settleDate" label="Settle Date" rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="settlePrice" label={hint('Settle Price', 'Exchange official daily settlement price.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={6} step={0.01} placeholder="72.45" />
            </Form.Item>
            <Form.Item name="tickSize" label={hint('Tick Size', 'Minimum price increment. CL: 0.01 ($/bbl). NG: 0.001 ($/mmbtu). HO/RB: 0.0001 ($/gal). BZ: 0.01 ($/bbl).')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={6} step={0.001} placeholder="0.01" min={0.0001} />
            </Form.Item>
            <Form.Item name="tickCurrencyId" label="Tick CCY" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={currencyOptions} showSearch optionFilterProp="label" placeholder="USD" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="uomId" label="UoM" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={uomOptions} showSearch optionFilterProp="label" placeholder="BBL" />
            </Form.Item>
            <Form.Item name="source" label="Source" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={SETTLEMENT_SOURCES.map((s) => ({ value: s, label: s }))} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
          <Form.Item name="isConfirmed" label="Confirmed" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
