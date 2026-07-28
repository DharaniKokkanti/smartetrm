import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber, Select, Switch, TimePicker } from 'antd';
import { EditOutlined, StopOutlined, UploadOutlined, DownloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { App as AntApp } from 'antd';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { AuditInfo } from '@components/smart/AuditInfo';
import { usePeriods, useSavePeriod, useDeactivatePeriod, useMarketProductLinkOptions } from './hooks';
import {
  PERIOD_TYPES, PERIOD_STATUS_CODES,
  type Period, type PeriodInput, type PeriodType, type PeriodStatusCode, type PeriodUploadRow,
} from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useLookupValues } from '@features/tier2/hooks';
import { useHolidayCalendars } from '@features/calendar/holiday-calendars/hooks';
import { downloadBlob, generatePeriodTemplate } from './excelTemplate';
import { parsePeriodUpload } from './excelUpload';
import { PeriodUploadReviewModal } from './PeriodUploadReviewModal';
import { PeriodAutoGenerateModal } from './PeriodAutoGenerateModal';

const TYPE_COLOR: Record<PeriodType, string> = {
  DAY: 'default', WEEK: 'lime', MONTH: 'green', QUARTER: 'blue',
  HALF_YEAR: 'purple', YEAR: 'gold', SEASON: 'cyan', CROP_YEAR: 'volcano',
  INTRADAY: 'magenta', SPOT: 'red', CUSTOM: 'default',
};

const STATUS_COLOR: Record<PeriodStatusCode, string> = {
  OPEN: 'processing', CLOSED: 'default', LOCKED: 'warning', ARCHIVED: 'error',
};

const ROLL_UNITS = ['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR'] as const;

const optionalDate = (v: string | null | undefined) => (v ? (dayjs(v) as unknown as string) : undefined);
const formatDate = (v: unknown) => (v ? dayjs(v as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null);

export function PeriodsPage() {
  const { message } = AntApp.useApp();
  const { data, isLoading, refetch } = usePeriods();
  const { data: marketProducts = [] } = useMarketProductLinkOptions();
  const save = useSavePeriod();
  const deactivate = useDeactivatePeriod();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Period | null>(null);
  const [uploadRows, setUploadRows] = useState<PeriodUploadRow[] | null>(null);
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form] = Form.useForm<PeriodInput>();
  useFormDraft('calendar-periods', { form, open, setOpen, editing, setEditing });
  const { data: loadTypeRows = [] } = useLookupValues('LOAD_TYPE');
  const loadTypeOpts = loadTypeRows.map((l) => ({ value: l.typeCode, label: l.typeName }));
  const { data: gasDayTypeRows = [] } = useLookupValues('GAS_DAY_TYPE');
  const gasDayTypeOpts = gasDayTypeRows.map((g) => ({ value: g.typeCode, label: g.typeName }));
  const { data: calendars = [] } = useHolidayCalendars();
  const calendarOpts = calendars.filter((c) => c.isActive).map((c) => ({ value: c.calendarCode, label: `${c.calendarCode} — ${c.calendarName}` }));
  const marketProductOpts = marketProducts.map((m) => ({ value: m.marketProductLinkId, label: `${m.marketCode ?? '—'} / ${m.productCode ?? '—'}` }));
  const isRollingWatch = Form.useWatch('isRolling', form);

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); form.setFieldValue('statusCode', 'OPEN'); form.setFieldValue('isRolling', false); setOpen(true); }
  function openEdit(p: Period) {
    setEditing(p);
    form.setFieldsValue({
      marketProductLinkId: p.marketProductLinkId,
      periodCode: p.periodCode, periodName: p.periodName, periodType: p.periodType,
      isRolling: p.isRolling, rollOffset: p.rollOffset ?? undefined, rollUnit: p.rollUnit ?? undefined,
      isTradingPeriod: p.isTradingPeriod, isRiskPeriod: p.isRiskPeriod, isSettlementPeriod: p.isSettlementPeriod,
      startDate: dayjs(p.startDate) as unknown as string, endDate: dayjs(p.endDate) as unknown as string,
      deliveryStartDate: optionalDate(p.deliveryStartDate), deliveryEndDate: optionalDate(p.deliveryEndDate),
      firstTradeDate: optionalDate(p.firstTradeDate), expiryDate: optionalDate(p.expiryDate),
      lastTradeDate: optionalDate(p.lastTradeDate), optionExpDate: optionalDate(p.optionExpDate),
      settlementDate: optionalDate(p.settlementDate), firstNoticeDate: optionalDate(p.firstNoticeDate),
      lastNoticeDate: optionalDate(p.lastNoticeDate),
      pricingCalendarCode: p.pricingCalendarCode ?? undefined, settlementCalendarCode: p.settlementCalendarCode ?? undefined,
      loadType: p.loadType ?? undefined, gasDayType: p.gasDayType ?? undefined,
      startTimeUtc: p.startTimeUtc ? dayjs(p.startTimeUtc, 'HH:mm') as unknown as string : undefined,
      endTimeUtc: p.endTimeUtc ? dayjs(p.endTimeUtc, 'HH:mm') as unknown as string : undefined,
      cropYearOffsetMonths: p.cropYearOffsetMonths ?? undefined,
      curveLabel: p.curveLabel ?? undefined, notes: p.notes ?? undefined,
      statusCode: p.statusCode, isActive: p.isActive,
    });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const input: PeriodInput = {
      ...v,
      startDate: formatDate(v.startDate) ?? '',
      endDate: formatDate(v.endDate) ?? '',
      deliveryStartDate: formatDate(v.deliveryStartDate),
      deliveryEndDate: formatDate(v.deliveryEndDate),
      rollOffset: v.isRolling ? (v.rollOffset ?? null) : null,
      rollUnit: v.isRolling ? (v.rollUnit ?? null) : null,
      firstTradeDate: formatDate(v.firstTradeDate),
      expiryDate: formatDate(v.expiryDate),
      lastTradeDate: formatDate(v.lastTradeDate),
      optionExpDate: formatDate(v.optionExpDate),
      settlementDate: formatDate(v.settlementDate),
      firstNoticeDate: formatDate(v.firstNoticeDate),
      lastNoticeDate: formatDate(v.lastNoticeDate),
      loadType: v.loadType ?? null,
      gasDayType: v.gasDayType ?? null,
      startTimeUtc: v.startTimeUtc ? dayjs(v.startTimeUtc as unknown as dayjs.Dayjs).format('HH:mm') : null,
      endTimeUtc: v.endTimeUtc ? dayjs(v.endTimeUtc as unknown as dayjs.Dayjs).format('HH:mm') : null,
      cropYearOffsetMonths: v.cropYearOffsetMonths ?? null,
      curveLabel: v.curveLabel ?? null,
      notes: v.notes ?? null,
      pricingCalendarCode: v.pricingCalendarCode ?? null,
      settlementCalendarCode: v.settlementCalendarCode ?? null,
    };
    const saved = await save.mutateAsync({ id: editing?.periodId ?? null, input: { ...input, rowVersion: editing?.rowVersion ?? 0 } });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const rows = await parsePeriodUpload(file, data ?? [], marketProducts);
      if (rows.length === 0) {
        message.warning('No data rows found in that file.');
        return;
      }
      setUploadRows(rows);
    } catch (err) {
      message.error('Could not read that file — is it a valid .xlsx export of the template?');
      console.error(err);
    }
  }

  async function handleDownloadTemplate() {
    const blob = await generatePeriodTemplate(marketProducts);
    downloadBlob(blob, 'period_upload_template.xlsx');
  }

  const colDefs = useMemo<ColDef<Period>[]>(() => [
    { field: 'periodCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
    { field: 'periodName', headerName: 'Period', flex: 1, minWidth: 160 },
    {
      headerName: 'Market / Product', width: 160,
      valueGetter: (p) => `${p.data?.marketCode ?? '—'} / ${p.data?.productCode ?? '—'}`,
    },
    { field: 'periodType', headerName: 'Type', width: 110, cellRenderer: (p: { value: PeriodType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'startDate', headerName: 'Start', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—' },
    { field: 'endDate', headerName: 'End', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—' },
    { field: 'lastTradeDate', headerName: 'Last Trade', width: 115, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—' },
    { field: 'expiryDate', headerName: 'Expiry', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—' },
    { field: 'firstNoticeDate', headerName: 'First Notice', width: 115, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? dayjs(p.value as string).format('DD MMM YYYY') : '—' },
    { field: 'loadType', headerName: 'Load Type', width: 100, valueFormatter: (p) => p.value ?? '—' },
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
      <PageHeader title="Periods" description="Trading periods keyed by market + product — daily, monthly, quarterly, annual, spot and prompt, with contract lifecycle dates." moduleGroup="calendar"
        extra={
          <Space>
            <Button icon={<ThunderboltOutlined />} onClick={() => setAutoGenOpen(true)}>Auto-Generate</Button>
            <Button icon={<DownloadOutlined />} onClick={() => { void handleDownloadTemplate(); }}>Download Template</Button>
            <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>Upload Excel</Button>
            <input ref={fileInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={(e) => { void handleFileSelected(e); }} />
          </Space>
        }
      />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Period" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.periodId)} />

      <Drawer mask={false} forceRender title={editing ? `Edit Period — ${editing.periodCode}` : 'New Period'} open={open} onClose={() => setOpen(false)} width={560}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="marketProductLinkId" label={hint('Market Product', 'Which market AND product this period belongs to — every exchange-listed contract month has its own lifecycle dates that differ by market as well as by product.')} rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={marketProductOpts} />
          </Form.Item>
          <Form.Item name="periodCode" label={hint('Period Code', 'Standardized code used in trade capture. Convention: monthly JAN-27, quarterly Q1-2027, annual CAL-2027. Spot/prompt: SPOT, M+1, Q+1.', 'JAN-27')} rules={[{ required: true }]}>
            <Input placeholder="JAN-27" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="periodName" label="Period Name" rules={[{ required: true }]}>
            <Input placeholder="January 2027" />
          </Form.Item>
          <Form.Item name="periodType" label={hint('Period Type', 'MONTH: calendar month (most common in oil/gas). QUARTER: 3-month strips. YEAR: full calendar year. HALF_YEAR: 6-month strip. SEASON: e.g. Summer/Winter gas seasons. CROP_YEAR: agri marketing year. INTRADAY: sub-daily block. SPOT: immediate/current delivery. DAY/WEEK: single day/week — also the LME metals daily/weekly prompt-date convention.', 'MONTH')} rules={[{ required: true }]}>
            <Select options={PERIOD_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Form.Item name="isRolling" label={hint('Rolling Template', 'A rolling row (e.g. "M+1") resolves to a concrete month/quarter at runtime via Roll Offset/Unit, instead of having fixed dates itself.')} valuePropName="checked"><Switch /></Form.Item>
          {isRollingWatch && (
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item name="rollOffset" label={hint('Roll Offset', '0 = prompt/current, 1 = second month/quarter/year, etc.', '1')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item name="rollUnit" label="Roll Unit" style={{ flex: 1 }}>
                <Select options={ROLL_UNITS.map((u) => ({ label: u, value: u }))} />
              </Form.Item>
            </Space>
          )}
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="startDate" label={hint('Start Date', 'First calendar day of the pricing period.', '2027-01-01')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="endDate" label={hint('End Date', 'Last calendar day of the period (inclusive).', '2027-01-31')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="firstTradeDate" label={hint('First Trade Date', 'When this contract month was first listed for trading.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="lastTradeDate" label={hint('Last Trade Date', 'The final day this contract can be traded.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="expiryDate" label={hint('Expiry Date', 'Contract expiry — usually same as or shortly after Last Trade Date.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="optionExpDate" label={hint('Option Expiry Date', 'Expiration of options written on this contract — NOT assumed equal to Last Trade Date (often a few business days earlier).')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="firstNoticeDate" label={hint('First Notice Date', 'Physical delivery only — earliest day a holder can be assigned delivery. Note: for some commodities (e.g. agri) this comes BEFORE Last Trade Date, not after.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="lastNoticeDate" label={hint('Last Notice Date', 'Physical delivery only — final day delivery notices can be tendered.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Form.Item name="settlementDate" label={hint('Settlement Date', 'Date whose price is used for final cash settlement.')}>
            <AppDatePicker />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="deliveryStartDate" label={hint('Delivery Start', 'Physical delivery window start — may differ from the pricing period.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="deliveryEndDate" label="Delivery End" style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="pricingCalendarCode" label={hint('Pricing Calendar', 'Holiday calendar used to identify valid pricing days.', 'LON, NYC, LME')} style={{ flex: 1 }}>
              <Select allowClear showSearch optionFilterProp="label" options={calendarOpts} placeholder="Select calendar" />
            </Form.Item>
            <Form.Item name="settlementCalendarCode" label={hint('Settlement Calendar', 'Calendar used for payment date calculations.', 'NYC')} style={{ flex: 1 }}>
              <Select allowClear showSearch optionFilterProp="label" options={calendarOpts} placeholder="Select calendar" />
            </Form.Item>
          </Space>
          <Form.Item name="loadType" label={hint('Load Type', 'Power-specific sub-period: BASE (all hours), PEAK, OFF_PEAK, EXTENDED_PEAK, OVERNIGHT. Values come from Lookup Values, category \'LOAD_TYPE\'.')}>
            <Select allowClear options={loadTypeOpts} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="startTimeUtc" label={hint('Block Start (UTC)', 'Exact start time for an hourly/sub-hourly power block.', '07:00')} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endTimeUtc" label={hint('Block End (UTC)', 'Leave blank if this period is a standard full calendar/gas day.', '19:00')} style={{ flex: 1 }}>
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="gasDayType" label={hint('Gas Day Type', 'GAS_DAY: standard 06:00-06:00 gas day. WITHIN_DAY, DAY_AHEAD, WEEKEND. Values come from Lookup Values, category \'GAS_DAY_TYPE\'.')}>
            <Select allowClear options={gasDayTypeOpts} />
          </Form.Item>
          <Form.Item name="cropYearOffsetMonths" label={hint('Crop Year Start Month', 'Calendar month (1-12) the physical marketing year starts.', '9 (September)')}>
            <InputNumber style={{ width: '100%' }} min={1} max={12} />
          </Form.Item>
          <Form.Item name="curveLabel" label={hint('Curve Label', 'Forward-curve tenor label used by the quant engine and pricing UI.', 'JAN-27')}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="statusCode" label={hint('Period Status', 'OPEN: active, trades can reference this period. CLOSED: pricing complete. LOCKED: closed and financially settled. ARCHIVED: historical record only.')} rules={[{ required: true }]}>
            <Select options={PERIOD_STATUS_CODES.map((s) => ({ label: s, value: s }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 24 }}>
            <Form.Item name="isTradingPeriod" label={hint('Trading Period', 'Available in trade capture — traders can select this period on a deal.')} valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="isRiskPeriod" label={hint('Risk Period', 'Used as a risk bucket for position/exposure reporting.')} valuePropName="checked"><Switch /></Form.Item>
            <Form.Item name="isSettlementPeriod" label={hint('Settlement Period', 'Used for settlement price calculation.')} valuePropName="checked"><Switch /></Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} createdBy={editing?.createdBy} updatedAt={editing?.updatedAt} updatedBy={editing?.updatedBy} />
      </Drawer>

      <PeriodUploadReviewModal open={uploadRows !== null} rows={uploadRows ?? []} onClose={() => setUploadRows(null)} />
      <PeriodAutoGenerateModal open={autoGenOpen} onClose={() => setAutoGenOpen(false)} marketProducts={marketProducts} periods={data ?? []} />
    </>
  );
}
