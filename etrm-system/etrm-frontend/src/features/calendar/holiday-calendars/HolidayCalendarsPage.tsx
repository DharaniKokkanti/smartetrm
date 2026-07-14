import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Table, Modal, Typography, App as AntApp } from 'antd';
import { EditOutlined, StopOutlined, CalendarOutlined, PlusOutlined, UploadOutlined, DownloadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import {
  useHolidayCalendars, useSaveHolidayCalendar, useDeactivateHolidayCalendar,
  useCalendarHolidays, useSaveHoliday, useDeleteHoliday,
} from './hooks';
import { CALENDAR_TYPES, type HolidayCalendar, type HolidayCalendarInput, type CalendarType, type CalendarHoliday, type HolidayInput, type HolidayUploadRow } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { downloadBlob, generateHolidayTemplate } from './excelTemplateHolidays';
import { parseHolidayUpload } from './excelUploadHolidays';
import { HolidayUploadReviewModal } from './HolidayUploadReviewModal';
import { useCountries } from '@features/reference/countries/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';

const TYPE_COLOR: Record<CalendarType, string> = {
  BANKING: 'blue', COMMODITY: 'gold', EXCHANGE: 'purple', CUSTOM: 'default',
};

function AddHolidayModal({ calendarId, open, onClose }: { calendarId: number; open: boolean; onClose: () => void }) {
  const save = useSaveHoliday(calendarId);
  const [form] = Form.useForm<{ holidayDate: dayjs.Dayjs; holidayName: string; isSettlementHoliday: boolean; isTradingHoliday: boolean }>();

  async function handleOk() {
    const v = await form.validateFields();
    const input: HolidayInput = {
      calendarId,
      holidayDate: v.holidayDate.format('YYYY-MM-DD'),
      holidayName: v.holidayName,
      isSettlementHoliday: v.isSettlementHoliday,
      isTradingHoliday: v.isTradingHoliday,
    };
    await save.mutateAsync(input);
    form.resetFields();
    onClose();
  }

  return (
    <Modal mask={false} title="Add Holiday" open={open} onCancel={onClose} onOk={() => { void handleOk(); }} okText="Add" confirmLoading={save.isPending} destroyOnHidden>
      <Form form={form} layout="vertical" initialValues={{ isSettlementHoliday: true, isTradingHoliday: true }}>
        <Form.Item name="holidayDate" label="Date" rules={[{ required: true }]}>
          <AppDatePicker style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="holidayName" label="Holiday Name" rules={[{ required: true }]}>
          <Input placeholder="New Year's Day" />
        </Form.Item>
        <Space size={24}>
          <Form.Item name="isSettlementHoliday" label={hint('Settlement Holiday', 'Blocks payment/delivery date rolls. A day can be a settlement holiday without closing the exchange itself.')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isTradingHoliday" label={hint('Trading Holiday', 'Closes the exchange/market itself — a day can be this without blocking settlement, or vice versa.')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
}

function HolidayDrawer({ calendar, onClose }: { calendar: HolidayCalendar; onClose: () => void }) {
  const calendarId = calendar.calendarId;
  const { data, isLoading } = useCalendarHolidays(calendarId);
  const deleteHoliday = useDeleteHoliday(calendarId);
  const { message } = AntApp.useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [uploadRows, setUploadRows] = useState<HolidayUploadRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() => [...(data ?? [])].sort((a, b) => a.holidayDate.localeCompare(b.holidayDate)), [data]);

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const rows = await parseHolidayUpload(file, calendarId, data ?? []);
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
    const blob = await generateHolidayTemplate(calendar.calendarCode);
    downloadBlob(blob, `${calendar.calendarCode}_holiday_upload_template.xlsx`);
  }

  return (
    <Drawer mask={false} forceRender title={`Holiday Dates — ${calendar.calendarCode}`} open onClose={onClose} width={520}
      extra={
        <Space>
          <Button size="small" icon={<DownloadOutlined />} onClick={() => { void handleDownloadTemplate(); }}>Template</Button>
          <Button size="small" icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>Upload</Button>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Holiday</Button>
          <input ref={fileInputRef} type="file" accept=".xlsx" style={{ display: 'none' }} onChange={(e) => { void handleFileSelected(e); }} />
        </Space>
      }
    >
      <Table<CalendarHoliday> dataSource={sorted} rowKey="holidayId" pagination={false} size="small" loading={isLoading}
        columns={[
          { title: 'Date', dataIndex: 'holidayDate', render: (v: string) => dayjs(v).format('DD MMM YYYY'), width: 120 },
          { title: 'Holiday', dataIndex: 'holidayName' },
          { title: 'Settlement', dataIndex: 'isSettlementHoliday', width: 90, render: (v: boolean) => v ? <Tag color="blue">YES</Tag> : null },
          { title: 'Trading', dataIndex: 'isTradingHoliday', width: 80, render: (v: boolean) => v ? <Tag color="purple">YES</Tag> : null },
          {
            title: '', width: 50, render: (_: unknown, r: CalendarHoliday) => (
              <Popconfirm title="Remove this holiday?" onConfirm={() => deleteHoliday.mutate(r.holidayId)} okText="Remove" okButtonProps={{ danger: true }}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]} />
      {sorted.length === 0 && !isLoading && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          No holidays on this calendar yet — add one manually or upload a spreadsheet using the template above.
        </Typography.Text>
      )}

      <AddHolidayModal calendarId={calendarId} open={addOpen} onClose={() => setAddOpen(false)} />
      {uploadRows && (
        <HolidayUploadReviewModal open={!!uploadRows} calendarId={calendarId} rows={uploadRows} onClose={() => setUploadRows(null)} />
      )}
    </Drawer>
  );
}

export function HolidayCalendarsPage() {
  const { data, isLoading, refetch } = useHolidayCalendars();
  const save = useSaveHolidayCalendar();
  const deactivate = useDeactivateHolidayCalendar();
  const { data: countries = [] } = useCountries();
  const countryOptions = countries.map((c) => ({ value: c.countryId, label: `${c.countryCode} — ${c.countryName}` }));
  const countryLabelById = new Map(countries.map((c) => [c.countryId, `${c.countryCode} — ${c.countryName}`]));
  const { data: currencies = [] } = useCurrencies();
  const currencyOptions = currencies.map((c) => ({ value: c.currencyId, label: c.currencyCode }));
  const currencyCodeById = new Map(currencies.map((c) => [c.currencyId, c.currencyCode]));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HolidayCalendar | null>(null);
  const [viewingCal, setViewingCal] = useState<HolidayCalendar | null>(null);
  const [form] = Form.useForm<HolidayCalendarInput>();
  useFormDraft('calendar-holiday-calendars', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(c: HolidayCalendar) {
    setEditing(c);
    form.setFieldsValue({ calendarCode: c.calendarCode, calendarName: c.calendarName, calendarType: c.calendarType, countryId: c.countryId ?? undefined, currencyId: c.currencyId ?? undefined, description: c.description ?? undefined, isActive: c.isActive });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.calendarId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<HolidayCalendar>[]>(() => [
    { field: 'calendarCode', headerName: 'Code', cellClass: 'cell-mono', width: 120, pinned: 'left',
      tooltipValueGetter: () => 'Calendar code used in trade/pricing configuration. Standard codes: LON (London), NYC (New York), TOK (Tokyo), NYMEX, LME' },
    { field: 'calendarName', headerName: 'Calendar', flex: 1.4, minWidth: 200 },
    { field: 'calendarType', headerName: 'Type', width: 110, cellRenderer: (p: { value: CalendarType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'countryId', headerName: 'Country', width: 130, valueFormatter: (p) => (p.value != null ? countryLabelById.get(p.value) ?? String(p.value) : '—') },
    { field: 'currencyId', headerName: 'CCY', width: 75, cellClass: 'cell-mono',
      valueFormatter: (p) => (p.value != null ? currencyCodeById.get(p.value) ?? '—' : '—'),
      tooltipValueGetter: () => 'Settlement currency this calendar covers — e.g. USD (Fed), GBP (BoE), EUR (ECB)' },
    { field: 'holidayCount', headerName: 'Holidays', width: 100, cellClass: 'cell-mono',
      tooltipValueGetter: () => 'Total holiday dates across all years in this calendar' },
    { field: 'description', headerName: 'Description', flex: 1, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 115, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: HolidayCalendar }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<CalendarOutlined />} onClick={() => setViewingCal(p.data)} title="View holidays" />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate calendar?" onConfirm={() => deactivate.mutate(p.data.calendarId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate, countryLabelById, currencyCodeById]);

  return (
    <>
      <PageHeader title="Holiday Calendars" description="Banking, commodity, and exchange holiday calendars used for payment date and pricing period calculations." moduleGroup="calendar" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Calendar" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.calendarId)} />

      {viewingCal != null && <HolidayDrawer calendar={viewingCal} onClose={() => setViewingCal(null)} />}

      <Drawer mask={false} forceRender title={editing ? `Edit Calendar — ${editing.calendarCode}` : 'New Calendar'} open={open} onClose={() => setOpen(false)} width={480}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="calendarCode" label={hint('Calendar Code', 'Short code used in trade pricing configuration, payment date calculations, and settlement. Industry-standard codes: LON (London banking), NYC (Fed/SIFMA), NYMEX, LME, ECB, TOCOM.', 'LON, NYC, NYMEX, LME')} rules={[{ required: true }]}>
            <Input placeholder="LON" maxLength={20} showCount style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="calendarName" label="Calendar Name" rules={[{ required: true }]}>
            <Input placeholder="London Banking Days" />
          </Form.Item>
          <Form.Item name="calendarType" label={hint('Calendar Type', 'BANKING: central bank and interbank holidays affecting payment dates. COMMODITY: commodity market holidays (LME, NYMEX, ICE). EXCHANGE: venue-specific trading holidays. CUSTOM: bespoke calendar for specific counterparty or bilateral agreement.', 'BANKING')} rules={[{ required: true }]}>
            <Select options={CALENDAR_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="countryId" label={hint('Country', 'Country whose public holidays are included.', 'GB, US, JP')} style={{ flex: 1 }}>
              <Select options={countryOptions} showSearch optionFilterProp="label" allowClear placeholder="Select country" />
            </Form.Item>
            <Form.Item name="currencyId" label={hint('Currency', 'Links this calendar to its settlement currency. LON → GBP, NYC → USD, ECB → EUR. Used to determine applicable calendar for FX payments.')} style={{ flex: 1 }}>
              <Select options={currencyOptions} showSearch optionFilterProp="label" allowClear placeholder="Select currency" />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} maxLength={500} showCount placeholder="UK public holidays and Bank Holidays as observed by the London interbank market" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
