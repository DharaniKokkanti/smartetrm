import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { usePriceIndices } from '@features/markets/price-indices/hooks';
import { usePriceSources } from '@features/pricing/price-sources/hooks';
import { usePeriods } from '@features/calendar/periods/hooks';
import { useTickerMappings, useSaveTickerMapping, useDeactivateTickerMapping } from './hooks';
import { TickerMappingAutoGenerateModal } from './TickerMappingAutoGenerateModal';
import type { TickerMapping, TickerMappingInput } from './types';

export function TickerMappingsPage() {
  const { data = [], isLoading, refetch } = useTickerMappings();
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const { data: priceIndices = [] } = usePriceIndices();
  const { data: priceSources = [] } = usePriceSources();
  const { data: periods = [] } = usePeriods();
  const save = useSaveTickerMapping();
  const deactivate = useDeactivateTickerMapping();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TickerMapping | null>(null);
  const [form] = Form.useForm<TickerMappingInput>();
  useFormDraft('ticker-mappings', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true, effectiveFrom: dayjs() as unknown as string } as unknown as TickerMappingInput);
    setOpen(true);
  }

  function openEdit(r: TickerMapping) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      periodId: r.periodId ?? undefined,
      settleTicker: r.settleTicker ?? undefined,
      openTicker: r.openTicker ?? undefined,
      highTicker: r.highTicker ?? undefined,
      lowTicker: r.lowTicker ?? undefined,
      avgTicker: r.avgTicker ?? undefined,
      promptTicker: r.promptTicker ?? undefined,
      bidTicker: r.bidTicker ?? undefined,
      askTicker: r.askTicker ?? undefined,
      midTicker: r.midTicker ?? undefined,
      notes: r.notes ?? undefined,
      effectiveFrom: r.effectiveFrom ? dayjs(r.effectiveFrom) : undefined,
      effectiveTo: r.effectiveTo ? dayjs(r.effectiveTo) : undefined,
    } as unknown as TickerMappingInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: TickerMappingInput = {
      ...values,
      periodId: values.periodId ?? null,
      settleTicker: values.settleTicker ?? null,
      openTicker: values.openTicker ?? null,
      highTicker: values.highTicker ?? null,
      lowTicker: values.lowTicker ?? null,
      avgTicker: values.avgTicker ?? null,
      promptTicker: values.promptTicker ?? null,
      bidTicker: values.bidTicker ?? null,
      askTicker: values.askTicker ?? null,
      midTicker: values.midTicker ?? null,
      notes: values.notes ?? null,
      effectiveFrom: v.effectiveFrom ? v.effectiveFrom.format('YYYY-MM-DD') : (values.effectiveFrom as unknown as string),
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
    };
    await save.mutateAsync({ id: editing?.tickerMappingId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(null);
  }

  const priceIndexOpts = useMemo(
    () => (priceIndices as { priceIndexId: number; indexCode: string; indexName: string }[]).map((i) => ({
      value: i.priceIndexId, label: `${i.indexCode} — ${i.indexName}`,
    })),
    [priceIndices],
  );

  const priceSourceOpts = useMemo(
    () => (priceSources as { priceSourceId: number; sourceCode: string; sourceName: string }[]).map((s) => ({
      value: s.priceSourceId, label: `${s.sourceCode} — ${s.sourceName}`,
    })),
    [priceSources],
  );

  const periodOpts = useMemo(
    () => (periods as { periodId: number; periodCode: string; periodName: string }[]).map((p) => ({
      value: p.periodId, label: `${p.periodCode} — ${p.periodName}`,
    })),
    [periods],
  );

  const colDefs = useMemo<ColDef<TickerMapping>[]>(() => [
    { field: 'priceIndexCode', headerName: 'Price Index', width: 130, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'priceIndexName', headerName: 'Index Name', flex: 1, minWidth: 160 },
    { field: 'periodCode', headerName: 'Period', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '(rolling / spot)' },
    { field: 'sourceCode', headerName: 'Source', width: 110, cellClass: 'cell-mono' },
    { field: 'settleTicker', headerName: 'Settle', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'openTicker', headerName: 'Open', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'highTicker', headerName: 'High', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'lowTicker', headerName: 'Low', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'avgTicker', headerName: 'Avg', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'promptTicker', headerName: 'Prompt', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'bidTicker', headerName: 'Bid', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'askTicker', headerName: 'Ask', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'midTicker', headerName: 'Mid', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveFrom', headerName: 'From', width: 105, cellClass: 'cell-mono' },
    { field: 'effectiveTo', headerName: 'To', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: TickerMapping }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this ticker mapping?" onConfirm={() => deactivate.mutate(p.data.tickerMappingId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Ticker Mappings"
        description="Where a vendor/exchange ticker string is set up before a price load runs — maps it to the Price Index it feeds, the specific Period/tenor it represents (leave blank for a rolling/continuous ticker), and the Price Source that publishes it. A price loader resolves incoming rows against this table instead of parsing ticker conventions."
        moduleGroup="pricing"
        extra={<Button icon={<ThunderboltOutlined />} onClick={() => setAutoGenOpen(true)}>Auto-Generate</Button>}
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Ticker Mapping"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.tickerMappingId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Ticker Mapping' : 'New Ticker Mapping'}
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
          <Form.Item name="priceIndexId" label="Price Index" rules={[{ required: true }]}>
            <Select options={priceIndexOpts} showSearch optionFilterProp="label" placeholder="Select price index" />
          </Form.Item>
          <Form.Item
            name="periodId"
            label={hint('Period / Tenor', 'Which delivery period this ticker represents. Leave blank for a continuous/rolling front-month ticker that isn’t tied to one fixed month.', 'Mar-27')}
          >
            <Select options={periodOpts} showSearch optionFilterProp="label" placeholder="(rolling / spot — leave blank)" allowClear />
          </Form.Item>
          <Form.Item name="priceSourceId" label="Price Source" rules={[{ required: true }]}>
            <Select options={priceSourceOpts} showSearch optionFilterProp="label" placeholder="Select price source" />
          </Form.Item>
          {hint('Ticker per Price Field', 'The same vendor feed often publishes a different ticker string per price field — e.g. a separate settle vs. high vs. low ticker. Fill in only the fields this vendor actually publishes; at least one is required.')}
          <Space style={{ width: '100%', gap: 12 }} wrap>
            <Form.Item name="settleTicker" label="Settle" style={{ flex: 1, minWidth: 100 }}>
              <Input placeholder="CLH27" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="openTicker" label="Open" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="highTicker" label="High" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }} wrap>
            <Form.Item name="lowTicker" label="Low" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="avgTicker" label="Avg" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="promptTicker" label="Prompt" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }} wrap>
            <Form.Item name="bidTicker" label="Bid" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="askTicker" label="Ask" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="midTicker" label="Mid" style={{ flex: 1, minWidth: 100 }}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="effectiveTo" label={hint('Effective To', 'Leave blank while the ticker is currently live. Set an end date when a ticker rolls/retires — keeps history intact.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>

      <TickerMappingAutoGenerateModal open={autoGenOpen} onClose={() => setAutoGenOpen(false)} tickerMappings={data} />
    </>
  );
}
