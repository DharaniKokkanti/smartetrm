import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { usePeriods, useSavePeriod, useDeactivatePeriod } from './hooks';
import { PERIOD_TYPES, PERIOD_STATUS_CODES, type Period, type PeriodInput, type PeriodType, type PeriodStatusCode } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';

const TYPE_COLOR: Record<PeriodType, string> = {
  DAILY: 'default', WEEKLY: 'lime', MONTHLY: 'green', QUARTERLY: 'blue',
  SEMI_ANNUAL: 'purple', ANNUAL: 'gold', PROMPT: 'orange', SPOT: 'red', CUSTOM: 'default',
};

const STATUS_COLOR: Record<PeriodStatusCode, string> = {
  OPEN: 'processing', CLOSED: 'default', LOCKED: 'warning', ARCHIVED: 'error',
};

export function PeriodsPage() {
  const { data, isLoading, refetch } = usePeriods();
  const save = useSavePeriod();
  const deactivate = useDeactivatePeriod();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [form] = Form.useForm<PeriodInput>();
  useFormDraft('calendar-periods', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); form.setFieldValue('statusCode', 'OPEN'); setOpen(true); }
  function openEdit(p: Period) {
    setEditing(p);
    form.setFieldsValue({
      periodCode: p.periodCode, periodName: p.periodName, periodType: p.periodType,
      startDate: dayjs(p.startDate) as unknown as string, endDate: dayjs(p.endDate) as unknown as string,
      deliveryStartDate: p.deliveryStartDate ? dayjs(p.deliveryStartDate) as unknown as string : undefined,
      deliveryEndDate: p.deliveryEndDate ? dayjs(p.deliveryEndDate) as unknown as string : undefined,
      pricingCalendarCode: p.pricingCalendarCode ?? undefined, settlementCalendarCode: p.settlementCalendarCode ?? undefined,
      statusCode: p.statusCode, isActive: p.isActive,
    });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const input: PeriodInput = {
      ...v,
      startDate: dayjs(v.startDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD'),
      endDate: dayjs(v.endDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD'),
      deliveryStartDate: v.deliveryStartDate ? dayjs(v.deliveryStartDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
      deliveryEndDate: v.deliveryEndDate ? dayjs(v.deliveryEndDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.periodId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Period>[]>(() => [
    { field: 'periodCode', headerName: 'Code', cellClass: 'cell-mono', width: 140, pinned: 'left',
      tooltipValueGetter: () => 'Standard convention: monthly = M2026-01, quarterly = Q2026-Q1, annual = Y2026. Spot/Prompt follow trade date convention.' },
    { field: 'periodName', headerName: 'Period', flex: 1, minWidth: 160 },
    { field: 'periodType', headerName: 'Type', width: 110, cellRenderer: (p: { value: PeriodType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'startDate', headerName: 'Start', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—' },
    { field: 'endDate', headerName: 'End', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—' },
    { field: 'deliveryStartDate', headerName: 'Delivery Start', width: 125, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—',
      tooltipValueGetter: () => 'Physical delivery window may differ from pricing period. Gas month starts 1st but delivery can start from gas day (6:00 UK).' },
    { field: 'pricingCalendarCode', headerName: 'Pricing Cal', width: 120, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Holiday calendar used to determine pricing days. Only non-holiday business days count for price averaging.' },
    { field: 'settlementCalendarCode', headerName: 'Settlement Cal', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'statusCode', headerName: 'Status', width: 100, cellRenderer: (p: { value: PeriodStatusCode }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Period }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && p.data.statusCode === 'OPEN' && (
            <Popconfirm title="Deactivate period?" onConfirm={() => deactivate.mutate(p.data.periodId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Periods" description="Trading periods — daily, monthly, quarterly, annual, spot and prompt. Each period defines the pricing and delivery window for deals." moduleGroup="calendar" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Period" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.periodId)} />

      <Drawer mask={false} forceRender title={editing ? `Edit Period — ${editing.periodCode}` : 'New Period'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="periodCode" label={hint('Period Code', 'Standardized code used in trade capture. Convention: monthly M2026-01 (Jan 2026), quarterly Q2026-Q1, annual Y2026. Spot/prompt: SPOT, M+1, Q+1.', 'M2026-01, Q2026-Q1, Y2026, SPOT')} rules={[{ required: true }]}>
            <Input placeholder="M2026-01" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="periodName" label="Period Name" rules={[{ required: true }]}>
            <Input placeholder="January 2026" />
          </Form.Item>
          <Form.Item name="periodType" label={hint('Period Type', 'MONTHLY: calendar month (most common in oil/gas). QUARTERLY: 3-month strips. ANNUAL: full-year position. PROMPT: next delivery month (M+1). SPOT: immediate/current month delivery. DAILY: gas/power daily.', 'MONTHLY')} rules={[{ required: true }]}>
            <Select options={PERIOD_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="startDate" label={hint('Start Date', 'First calendar day of the pricing period. For monthly: 1st of month. Gas periods often start from gas day boundary (6:00 AM UK).', '2026-01-01')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="endDate" label={hint('End Date', 'Last calendar day of the period (inclusive). For monthly: last day of month. Check calendar for holiday impact on Last Trading Day.', '2026-01-31')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="deliveryStartDate" label={hint('Delivery Start', 'Physical delivery window start. May differ from pricing period — e.g. crude oil: pricing in month N, delivery in month N+1 (laytime basis).', '2026-01-01')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="deliveryEndDate" label="Delivery End" style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="pricingCalendarCode" label={hint('Pricing Calendar', 'Holiday calendar used to identify valid pricing days. Non-business days are excluded from price averaging. LON for Brent, NYC for WTI/Henry Hub, LME for base metals.', 'LON, NYC, LME')} style={{ flex: 1 }}>
              <Input placeholder="LON" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="settlementCalendarCode" label={hint('Settlement Calendar', 'Calendar used for payment date calculations. Usually the interbank calendar for the settlement currency (LON for GBP, NYC for USD, ECB for EUR).', 'NYC')} style={{ flex: 1 }}>
              <Input placeholder="NYC" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Form.Item name="statusCode" label={hint('Period Status', 'OPEN: active, trades can reference this period. CLOSED: pricing complete, final prices set. LOCKED: closed and financially settled, no edits. ARCHIVED: historical record only.')} rules={[{ required: true }]}>
            <Select options={PERIOD_STATUS_CODES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
