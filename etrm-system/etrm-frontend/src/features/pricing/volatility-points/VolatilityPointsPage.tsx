import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { EditOutlined, CheckCircleOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { useOptionIndexLinks } from '@features/pricing/option-index-links/hooks';
import { usePeriods } from '@features/calendar/periods/hooks';
import { usePriceSources } from '@features/pricing/price-sources/hooks';
import { useVolatilityPoints, useSaveVolatilityPoint, useConfirmVolatilityPoint } from './hooks';
import type { VolatilityPoint, VolatilityPointInput } from './types';

export function VolatilityPointsPage() {
  const { data = [], isLoading, refetch } = useVolatilityPoints();
  const { data: optionIndexLinks = [] } = useOptionIndexLinks();
  const { data: periods = [] } = usePeriods();
  const { data: priceSources = [] } = usePriceSources();
  const save = useSaveVolatilityPoint();
  const confirm = useConfirmVolatilityPoint();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VolatilityPoint | null>(null);
  const [form] = Form.useForm<VolatilityPointInput>();
  useFormDraft('volatility-points', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ moneynessLabel: 'ATM', quoteDate: dayjs() as unknown as string } as unknown as VolatilityPointInput);
    setOpen(true);
  }

  function openEdit(r: VolatilityPoint) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      strikePrice: r.strikePrice ?? undefined,
      notes: r.notes ?? undefined,
      quoteDate: r.quoteDate ? dayjs(r.quoteDate) : undefined,
    } as unknown as VolatilityPointInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: VolatilityPointInput = {
      ...values,
      strikePrice: values.strikePrice ?? null,
      notes: values.notes ?? null,
      quoteDate: v.quoteDate ? v.quoteDate.format('YYYY-MM-DD') : (values.quoteDate as unknown as string),
    };
    await save.mutateAsync({ id: editing?.volatilityPointId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(null);
  }

  const optionIndexOpts = useMemo(
    () => optionIndexLinks.map((l) => ({ value: l.optionIndexLinkId, label: `${l.optionIndexCode} (underlying: ${l.underlyingIndexCode})` })),
    [optionIndexLinks],
  );

  const periodOpts = useMemo(
    () => (periods as { periodId: number; periodCode: string; periodName: string }[]).map((p) => ({ value: p.periodId, label: `${p.periodCode} — ${p.periodName}` })),
    [periods],
  );

  const priceSourceOpts = useMemo(
    () => (priceSources as { priceSourceId: number; sourceCode: string; sourceName: string }[]).map((s) => ({ value: s.priceSourceId, label: `${s.sourceCode} — ${s.sourceName}` })),
    [priceSources],
  );

  const colDefs = useMemo<ColDef<VolatilityPoint>[]>(() => [
    { field: 'optionIndexCode', headerName: 'Option Index', width: 140, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'periodCode', headerName: 'Period', width: 110, cellClass: 'cell-mono' },
    { field: 'moneynessLabel', headerName: 'Moneyness', width: 110, cellRenderer: (p: { value: string }) => <Tag>{p.value}</Tag> },
    { field: 'strikePrice', headerName: 'Strike', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value != null ? Number(p.value).toFixed(4) : '—' },
    { field: 'quoteDate', headerName: 'Quote Date', width: 110, cellClass: 'cell-mono' },
    { field: 'impliedVolatility', headerName: 'Implied Vol', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value != null ? `${(Number(p.value) * 100).toFixed(2)}%` : '—' },
    { field: 'sourceCode', headerName: 'Source', width: 110, cellClass: 'cell-mono' },
    {
      field: 'isConfirmed', headerName: 'Confirmed', width: 100,
      cellRenderer: (p: { value: boolean }) => p.value
        ? <Tag color="success" style={{ fontSize: 10 }}>CONFIRMED</Tag>
        : <Tag color="warning" style={{ fontSize: 10 }}>PENDING</Tag>,
    },
    {
      headerName: '', width: 105, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: VolatilityPoint }) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {!p.data.isConfirmed && (
            <Popconfirm title="Confirm this volatility point?" onConfirm={() => confirm.mutate(p.data.volatilityPointId)} okText="Confirm" okButtonProps={{ icon: <CheckCircleOutlined /> }}>
              <Button type="text" size="small" icon={<CheckCircleOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [confirm]);

  return (
    <>
      <PageHeader
        title="Volatility Points"
        description="Implied-volatility quotes for option indices — one row per option index, expiry/tenor, strike or delta/moneyness bucket, quote date, and source. Feeds the volatility surface an option pricing model (see Option Index Links) reads from."
        moduleGroup="pricing"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Volatility Point"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.volatilityPointId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Volatility Point' : 'New Volatility Point'}
        open={open}
        onClose={() => setOpen(false)}
        width={460}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="optionIndexLinkId" label="Option Index" rules={[{ required: true }]}>
            <Select options={optionIndexOpts} showSearch optionFilterProp="label" placeholder="Select option index" />
          </Form.Item>
          <Form.Item name="periodId" label="Period / Expiry" rules={[{ required: true }]}>
            <Select options={periodOpts} showSearch optionFilterProp="label" placeholder="Select expiry period" />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="moneynessLabel" label={hint('Moneyness', 'Delta-style bucket (ATM, 25D_PUT, 25D_CALL) or a literal strike label — whichever convention this market quotes.', 'ATM, 25D_PUT, 25D_CALL')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="ATM" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="strikePrice" label={hint('Strike Price', 'Only populated when this point is strike-based rather than delta-based. Optional.')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={6} step={0.01} placeholder="—" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="quoteDate" label="Quote Date" rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="impliedVolatility" label={hint('Implied Volatility', 'Decimal form, not percent — 0.25 means 25% annualized vol.', '0.25')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} precision={6} step={0.01} min={0} placeholder="0.25" />
            </Form.Item>
          </Space>
          <Form.Item name="priceSourceId" label="Price Source" rules={[{ required: true }]}>
            <Select options={priceSourceOpts} showSearch optionFilterProp="label" placeholder="Select price source" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
