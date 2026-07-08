import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch, TimePicker } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useFormDraft } from '@components/smart/formDraft';
import { usePipelines } from '@features/trade/hooks';
import { useHolidayCalendars } from '@features/calendar/holiday-calendars/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { usePipelineCycles, useSavePipelineCycle, useDeactivatePipelineCycle } from './hooks';
import { CYCLE_TYPES, APPLIES_TO_DAYS, type PipelineCycle, type PipelineCycleInput } from './types';

const TYPE_COLOR: Record<string, string> = {
  INTRADAY: 'blue', DAILY: 'green', MONTHLY: 'purple', ADHOC: 'default',
};

const TIME_FIELDS = ['nominationDeadline', 'confirmationDeadline', 'schedulingDeadline', 'effectiveStart', 'effectiveEnd'] as const;
const DATE_FIELDS = ['effectiveFrom', 'effectiveTo'] as const;

export function PipelineCyclesPage() {
  const { data = [], isLoading, refetch } = usePipelineCycles();
  const save = useSavePipelineCycle();
  const deactivate = useDeactivatePipelineCycle();
  const { data: pipelines = [] } = usePipelines();
  const { data: calendars = [] } = useHolidayCalendars();
  const { data: productRows = [] } = useTableRows('product');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineCycle | null>(null);
  const [form] = Form.useForm<PipelineCycleInput>();
  useFormDraft('pipeline-cycles', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ cycleType: 'DAILY', appliesToDays: 'WEEKDAYS', cyclePriority: 1, isActive: true } as unknown as PipelineCycleInput);
    setOpen(true);
  }

  function openEdit(r: PipelineCycle) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      nominationDeadline: r.nominationDeadline ? dayjs(r.nominationDeadline, 'HH:mm') : undefined,
      confirmationDeadline: r.confirmationDeadline ? dayjs(r.confirmationDeadline, 'HH:mm') : undefined,
      schedulingDeadline: r.schedulingDeadline ? dayjs(r.schedulingDeadline, 'HH:mm') : undefined,
      effectiveStart: r.effectiveStart ? dayjs(r.effectiveStart, 'HH:mm') : undefined,
      effectiveEnd: r.effectiveEnd ? dayjs(r.effectiveEnd, 'HH:mm') : undefined,
      effectiveFrom: r.effectiveFrom ? dayjs(r.effectiveFrom) : undefined,
      effectiveTo: r.effectiveTo ? dayjs(r.effectiveTo) : undefined,
    } as unknown as PipelineCycleInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, dayjs.Dayjs | undefined>;
    const input: PipelineCycleInput = { ...values };
    for (const f of TIME_FIELDS) {
      (input as unknown as Record<string, string | null>)[f] = v[f] ? v[f]!.format('HH:mm') : null;
    }
    for (const f of DATE_FIELDS) {
      (input as unknown as Record<string, string | null>)[f] = v[f] ? v[f]!.format('YYYY-MM-DD') : null;
    }
    const saved = await save.mutateAsync({ id: editing?.cycleId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const pipelineOpts = useMemo(
    () => (pipelines as { pipelineId: number; pipelineCode: string; pipelineName: string }[])
      .map((p) => ({ value: p.pipelineId, label: `${p.pipelineCode} — ${p.pipelineName}` })),
    [pipelines],
  );
  const calendarOpts = useMemo(
    () => (calendars as { calendarId: number; calendarCode: string; calendarName: string }[])
      .map((c) => ({ value: c.calendarId, label: `${c.calendarCode} — ${c.calendarName}` })),
    [calendars],
  );
  const productOpts = useMemo(
    () => (productRows as unknown as { productId: number; productCode: string; productName: string }[])
      .map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` })),
    [productRows],
  );

  const colDefs = useMemo<ColDef<PipelineCycle>[]>(() => [
    { field: 'pipelineName', headerName: 'Pipeline', flex: 1, minWidth: 150, pinned: 'left' },
    { field: 'cycleCode', headerName: 'Code', width: 90, cellClass: 'cell-mono' },
    { field: 'cycleName', headerName: 'Cycle Name', flex: 1, minWidth: 140 },
    { field: 'cycleType', headerName: 'Type', width: 110, cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'productName', headerName: 'Product', width: 130, valueFormatter: (p) => p.value ?? 'All products' },
    { field: 'effectiveFrom', headerName: 'Valid From', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveTo', headerName: 'Valid To', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'nominationDeadline', headerName: 'Nom. Deadline', width: 120, cellClass: 'cell-mono' },
    { field: 'confirmationDeadline', headerName: 'Conf. Deadline', width: 120, cellClass: 'cell-mono' },
    { field: 'appliesToDays', headerName: 'Applies To', width: 110 },
    { field: 'cyclePriority', headerName: 'Priority', width: 85, cellClass: 'cell-mono' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PipelineCycle }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this cycle?" onConfirm={() => deactivate.mutate(p.data.cycleId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Pipeline Cycles"
        description="Nomination, confirmation, and scheduling cycles per pipeline — the rhythm shippers must follow to move gas or oil, e.g. NBP-style Within-Day 1/2/3 or a single daily oil-products cycle. Optionally scoped to one product on multi-product pipelines; blank applies to all products."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Cycle"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.cycleId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Pipeline Cycle' : 'New Pipeline Cycle'}
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
          <Form.Item name="pipelineId" label="Pipeline" rules={[{ required: true }]}>
            <Select options={pipelineOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="cycleCode" label="Cycle Code" style={{ width: '40%' }} rules={[{ required: true }]}>
              <Input style={{ fontFamily: 'monospace' }} placeholder="WD1" />
            </Form.Item>
            <Form.Item name="cycleName" label="Cycle Name" style={{ width: '60%' }} rules={[{ required: true }]}>
              <Input placeholder="Within Day 1" />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="cycleType" label="Cycle Type" rules={[{ required: true }]}>
            <Select options={CYCLE_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="productId" label="Product (blank = all products on this pipeline)">
            <Select options={productOpts} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="effectiveFrom" label="Valid From (blank = always in force)" style={{ width: '50%' }}>
              <AppDatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="effectiveTo"
              dependencies={['effectiveFrom']}
              label="Valid To (blank = no expiry)"
              style={{ width: '50%' }}
              rules={[
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    const from = getFieldValue('effectiveFrom');
                    if (!value || !from || !value.isBefore(from)) return Promise.resolve();
                    return Promise.reject(new Error('Valid To must be on or after Valid From'));
                  },
                }),
              ]}
            >
              <AppDatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="nominationDeadline" label="Nomination Deadline" style={{ width: '50%' }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="confirmationDeadline" label="Confirmation Deadline" style={{ width: '50%' }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="schedulingDeadline" label="Scheduling Deadline" style={{ width: '34%' }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="effectiveStart" label="Delivery Start" style={{ width: '33%' }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="effectiveEnd" label="Delivery End" style={{ width: '33%' }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="calendarId" label="Holiday Calendar">
            <Select options={calendarOpts} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="appliesToDays" label="Applies To" style={{ width: '50%' }} rules={[{ required: true }]}>
              <Select options={APPLIES_TO_DAYS.map((d) => ({ value: d, label: d }))} />
            </Form.Item>
            <Form.Item name="cyclePriority" label="Priority (1 = highest)" style={{ width: '50%' }} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={1} max={255} precision={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="tolerancePct" label="Nomination Tolerance %">
            <InputNumber style={{ width: '100%' }} min={0} max={100} precision={2} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
