import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Drawer, Form, Input, InputNumber,
  Switch, Select, Tag, Tooltip, Divider, Spin,
} from 'antd';
import { EditOutlined, StopOutlined, StarFilled, InfoCircleOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTableRows } from '@features/tier2/hooks';
import { usePaymentTerms, useSavePaymentTerm, useDeactivatePaymentTerm } from './hooks';
import type {
  PaymentTerm, PaymentTermInput,
  BaseDateEvent, BusinessDayConvention, DaysBasis, PaymentMethod,
} from './types';

// ── Static option maps for non-lookup fields ──────────────────────────────────

const METHOD_LABELS: Record<PaymentMethod, string> = {
  WIRE:             'Wire Transfer',
  LETTER_OF_CREDIT: 'Letter of Credit',
  BANK_GUARANTEE:   'Bank Guarantee',
  PREPAYMENT:       'Prepayment',
  NETTING:          'Netting',
  CHEQUE:           'Cheque',
  OTHER:            'Other',
};

function methodColor(m: PaymentMethod): string {
  const map: Partial<Record<PaymentMethod, string>> = {
    LETTER_OF_CREDIT: 'blue',
    BANK_GUARANTEE:   'purple',
    NETTING:          'cyan',
    PREPAYMENT:       'orange',
  };
  return map[m] ?? 'default';
}

// ── Calculation formula display ───────────────────────────────────────────────

function formulaText(t: PaymentTerm, bdeLabelMap: Record<string, string>): string {
  const base = bdeLabelMap[t.baseDateEvent] ?? t.baseDateEvent;
  const parts: string[] = [base];
  if (t.monthOffset !== 0) parts.push(`${t.monthOffset > 0 ? '+' : ''}${t.monthOffset}M`);
  if (t.fixedDayOfMonth != null) {
    parts.push(`→ ${t.fixedDayOfMonth}th`);
  } else if (t.offsetDays !== 0) {
    const biz = t.daysBasis === 'BUSINESS' ? ' BD' : 'D';
    parts.push(`${t.offsetDays > 0 ? '+' : ''}${t.offsetDays}${biz}`);
  }
  return parts.join(' ');
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function PaymentTermsPage() {
  const { data, isLoading, refetch } = usePaymentTerms();
  const save       = useSavePaymentTerm();
  const deactivate = useDeactivatePaymentTerm();

  // Load base date events and BDC types from static data (same source as Tier 2 UI)
  const { data: bdeRows = [], isLoading: bdeLoading } =
    useTableRows('base_date_event_type');
  const { data: bdcRows = [], isLoading: bdcLoading } =
    useTableRows('business_day_convention_type');

  // Build label map for formula column display
  const bdeLabelMap = useMemo(
    () => Object.fromEntries(bdeRows.map((r) => [r['typeCode'] as string, r['typeName'] as string])),
    [bdeRows],
  );

  // Group base date events by applicableCommodity for the Select
  const bdeOptions = useMemo(() => {
    const groups: Record<string, typeof bdeRows> = {};
    for (const r of bdeRows) {
      const grp = (r['applicableCommodity'] as string) ?? 'Other';
      (groups[grp] ??= []).push(r);
    }
    return Object.entries(groups).map(([label, items]) => ({
      label,
      options: items.map((r) => ({
        value: r['typeCode'] as string,
        label: r['typeName'] as string,
      })),
    }));
  }, [bdeRows]);

  const bdcOptions = useMemo(
    () => bdcRows.map((r) => ({
      value: r['typeCode'] as string,
      label: r['typeName'] as string,
    })),
    [bdcRows],
  );

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<PaymentTerm | null>(null);
  const [form]                = Form.useForm<PaymentTermInput>();

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      baseDateEvent:         'INVOICE_DATE' as BaseDateEvent,
      monthOffset:            0,
      offsetDays:             30,
      daysBasis:              'CALENDAR' as DaysBasis,
      businessDayConvention:  'MOD_FOLLOWING' as BusinessDayConvention,
      paymentMethod:          'WIRE' as PaymentMethod,
      invoiceLeadDays:        0,
      isDefault:              false,
      isActive:               true,
    });
    setOpen(true);
  }

  function openEdit(t: PaymentTerm) {
    setEditing(t);
    form.setFieldsValue({
      termCode:               t.termCode,
      termName:               t.termName,
      baseDateEvent:          t.baseDateEvent,
      monthOffset:            t.monthOffset,
      offsetDays:             t.offsetDays,
      daysBasis:              t.daysBasis,
      fixedDayOfMonth:        t.fixedDayOfMonth ?? undefined,
      businessDayConvention:  t.businessDayConvention,
      calendarId:             t.calendarId ?? undefined,
      discountDays:           t.discountDays ?? undefined,
      // display as % (0.02 → 2)
      discountPct:            t.discountPct != null ? +(t.discountPct * 100).toFixed(4) : undefined,
      paymentMethod:          t.paymentMethod,
      invoiceLeadDays:        t.invoiceLeadDays ?? 0,
      isDefault:              t.isDefault,
      description:            t.description ?? undefined,
      isActive:               t.isActive,
    });
    setOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    // Store discountPct as decimal (2 % → 0.02)
    if (values.discountPct != null) {
      values.discountPct = +(values.discountPct / 100).toFixed(6);
    }
    await save.mutateAsync({ id: editing?.paymentTermId ?? null, input: values });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<PaymentTerm>[]>(() => [
    {
      field: 'termCode', headerName: 'Code', cellClass: 'cell-mono',
      width: 155, pinned: 'left',
    },
    { field: 'termName', headerName: 'Term Name', flex: 1.5 },
    {
      headerName: 'Calculation', flex: 2,
      valueGetter: (p) => formulaText(p.data!, bdeLabelMap),
      cellStyle: { fontFamily: 'monospace', fontSize: 12 },
    },
    {
      field: 'paymentMethod', headerName: 'Method', width: 165,
      cellRenderer: (p: { value: PaymentMethod }) => (
        <Tag color={methodColor(p.value)}>{METHOD_LABELS[p.value] ?? p.value}</Tag>
      ),
    },
    {
      headerName: 'Discount', width: 110,
      valueGetter: (p) => {
        const t = p.data!;
        if (t.discountDays == null || t.discountPct == null) return null;
        return `${+(t.discountPct * 100).toFixed(2)}% / ${t.discountDays}D`;
      },
      valueFormatter: (p) => (p.value as string | null) ?? '—',
      cellClass: 'cell-mono',
    },
    {
      field: 'isDefault', headerName: 'Default', width: 85,
      cellRenderer: (p: { value: boolean }) =>
        p.value ? <StarFilled style={{ color: '#faad14' }} /> : null,
    },
    {
      field: 'isActive', headerName: 'Active', width: 85,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PaymentTerm }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm
              title="Deactivate this payment term?"
              onConfirm={() => deactivate.mutate(p.data.paymentTermId)}
              okText="Deactivate" okButtonProps={{ danger: true }}
            >
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate, bdeLabelMap]);

  const lookupLoading = bdeLoading || bdcLoading;

  return (
    <>
      <PageHeader
        title="Payment Terms"
        description="Defines when payment is due relative to a trade event — invoice date, Bill of Lading, end of delivery month, or pricing date. Supports calendar and business day offsets, fixed day-of-month, and early payment discounts."
        moduleGroup="contracts"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Payment Term"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.paymentTermId)}
      />

      <Drawer
        title={editing ? `Edit — ${editing.termCode}` : 'New Payment Term'}
        open={open}
        onClose={() => setOpen(false)}
        width={580}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={save.isPending}
              disabled={lookupLoading}>Save</Button>
          </Space>
        }
      >
        <Spin spinning={lookupLoading} tip="Loading lookup data…">
          <Form form={form} layout="vertical" size="middle">

            {/* ── Identification ──────────────────────────────────────────── */}
            <Form.Item
              name="termCode"
              label={hint('Term Code', 'Unique code used across contracts — e.g. BL_PLUS_30, M1_DOM_20, NET_30.', 'NET_30')}
              rules={[{ required: true, message: 'Term code is required' }]}
            >
              <Input placeholder="NET_30" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>

            <Form.Item
              name="termName"
              label="Term Name"
              rules={[{ required: true, message: 'Term name is required' }]}
            >
              <Input placeholder="Net 30 Calendar Days" />
            </Form.Item>

            {/* ── Date Calculation ───────────────────────────────────────── */}
            <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              Payment Date Calculation
              <Tooltip title="Payment Date = BD_adjust( base_date + monthOffset months + offsetDays days, convention, calendar ) — or snap to fixedDayOfMonth of the resulting month">
                <InfoCircleOutlined style={{ marginLeft: 6, color: '#9ca3af' }} />
              </Tooltip>
            </Divider>

            <Form.Item
              name="baseDateEvent"
              label={hint('Base Date Event', 'The trade event from which the payment date is calculated. Managed in Static Data → Payment Terms → Base Date Event Types.', 'INVOICE_DATE')}
              rules={[{ required: true }]}
            >
              <Select
                options={bdeOptions}
                placeholder="Select base date event"
                loading={bdeLoading}
                showSearch
                optionFilterProp="label"
              />
            </Form.Item>

            <Space style={{ width: '100%', alignItems: 'flex-start' }} size={12}>
              <Form.Item
                name="monthOffset"
                label={hint('Month Offset', 'Whole months added to the base date (e.g. 1 = following month for EDM terms).', '0')}
                style={{ flex: 1 }}
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0" />
              </Form.Item>

              <Form.Item
                name="offsetDays"
                label={hint('Offset Days', 'Days added after the month offset. Negative = prepayment.', '30')}
                style={{ flex: 1 }}
                rules={[{ required: true }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="30" />
              </Form.Item>

              <Form.Item
                name="daysBasis"
                label="Days Basis"
                style={{ flex: 1 }}
                rules={[{ required: true }]}
              >
                <Select options={[
                  { value: 'CALENDAR', label: 'Calendar' },
                  { value: 'BUSINESS', label: 'Business' },
                ]} />
              </Form.Item>
            </Space>

            <Form.Item
              name="fixedDayOfMonth"
              label={hint(
                'Fixed Day of Month',
                'If set, the payment date is snapped to this day-of-month after applying the month offset. ' +
                'E.g. Month Offset 1 + Fixed DOM 20 = 20th of the following month (M1 DOM 20 terms).',
                '20',
              )}
            >
              <InputNumber style={{ width: 120 }} placeholder="e.g. 20" min={1} max={31} />
            </Form.Item>

            {/* ── Business Day Adjustment ────────────────────────────────── */}
            <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              Business Day Adjustment
            </Divider>

            <Space style={{ width: '100%', alignItems: 'flex-start' }} size={12}>
              <Form.Item
                name="businessDayConvention"
                label={hint('Convention', 'How to roll if the calculated date falls on a non-business day. Managed in Static Data → Payment Terms → Business Day Conventions.', 'MOD_FOLLOWING')}
                style={{ flex: 1.4 }}
                rules={[{ required: true }]}
              >
                <Select
                  options={bdcOptions}
                  loading={bdcLoading}
                  showSearch
                  optionFilterProp="label"
                />
              </Form.Item>

              <Form.Item
                name="calendarId"
                label={hint('Holiday Calendar', 'Calendar used to determine business days (e.g. LON, LME, NYC). Managed in Calendar → Holiday Calendars.', '')}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="Calendar ID" min={1} />
              </Form.Item>
            </Space>

            {/* ── Early Payment Discount ─────────────────────────────────── */}
            <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              Early Payment Discount
            </Divider>

            <Space style={{ width: '100%', alignItems: 'flex-start' }} size={12}>
              <Form.Item
                name="discountDays"
                label={hint('Discount Window', 'Days from invoice within which the discount applies.', '10')}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="10" min={0} />
              </Form.Item>
              <Form.Item
                name="discountPct"
                label={hint('Discount %', 'Percentage discount for early settlement (enter as %, e.g. 2 = 2 %).', '2')}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="2.0" min={0} max={100} step={0.1} addonAfter="%" />
              </Form.Item>
            </Space>

            {/* ── Additional ────────────────────────────────────────────── */}
            <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
              Additional Settings
            </Divider>

            <Space style={{ width: '100%', alignItems: 'flex-start' }} size={12}>
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                style={{ flex: 1 }}
                rules={[{ required: true }]}
              >
                <Select options={Object.entries(METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
              </Form.Item>
              <Form.Item
                name="invoiceLeadDays"
                label={hint('Invoice Lead Days', 'Days before (+) or after (−) the base date to issue the invoice. 0 = invoice on base date.', '0')}
                style={{ flex: 1 }}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Space>

            <Form.Item name="description" label="Description">
              <Input.TextArea rows={3} placeholder="Optional description of when and how this term is used" />
            </Form.Item>

            <Space size={24}>
              <Form.Item name="isDefault" label="System Default" valuePropName="checked">
                <Switch />
              </Form.Item>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Space>
          </Form>
        </Spin>
      </Drawer>
    </>
  );
}
