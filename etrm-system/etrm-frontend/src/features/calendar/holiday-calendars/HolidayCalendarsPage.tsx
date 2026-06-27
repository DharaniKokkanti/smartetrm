import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Table, Badge } from 'antd';
import { EditOutlined, StopOutlined, CalendarOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useHolidayCalendars, useSaveHolidayCalendar, useDeactivateHolidayCalendar, useCalendarHolidays } from './hooks';
import { CALENDAR_TYPES, type HolidayCalendar, type HolidayCalendarInput, type CalendarType } from './types';

const TYPE_COLOR: Record<CalendarType, string> = {
  BANKING: 'blue', COMMODITY: 'gold', EXCHANGE: 'purple', CUSTOM: 'default',
};

function HolidayDrawer({ calendarId, onClose }: { calendarId: number; onClose: () => void }) {
  const { data, isLoading } = useCalendarHolidays(calendarId);
  const year = new Date().getFullYear();
  const currentYearHolidays = data?.filter((h) => h.holidayDate.startsWith(String(year))) ?? [];
  const nextYearHolidays = data?.filter((h) => h.holidayDate.startsWith(String(year + 1))) ?? [];

  return (
    <Drawer title="Holiday Dates" open onClose={onClose} width={440}>
      <div style={{ marginBottom: 12 }}><Badge count={currentYearHolidays.length} showZero><Tag>{year}</Tag></Badge></div>
      <Table dataSource={currentYearHolidays} rowKey="holidayId" pagination={false} size="small" loading={isLoading}
        columns={[
          { title: 'Date', dataIndex: 'holidayDate', render: (v: string) => dayjs(v).format('DD MMM YYYY'), width: 130 },
          { title: 'Holiday', dataIndex: 'holidayName' },
          { title: '', dataIndex: 'isPartialDay', width: 70, render: (v: boolean) => v ? <Tag color="orange">HALF</Tag> : null },
        ]} />
      {nextYearHolidays.length > 0 && (
        <>
          <div style={{ margin: '16px 0 8px' }}><Badge count={nextYearHolidays.length} showZero><Tag>{year + 1}</Tag></Badge></div>
          <Table dataSource={nextYearHolidays} rowKey="holidayId" pagination={false} size="small"
            columns={[
              { title: 'Date', dataIndex: 'holidayDate', render: (v: string) => dayjs(v).format('DD MMM YYYY'), width: 130 },
              { title: 'Holiday', dataIndex: 'holidayName' },
              { title: '', dataIndex: 'isPartialDay', width: 70, render: (v: boolean) => v ? <Tag color="orange">HALF</Tag> : null },
            ]} />
        </>
      )}
    </Drawer>
  );
}

export function HolidayCalendarsPage() {
  const { data, isLoading, refetch } = useHolidayCalendars();
  const save = useSaveHolidayCalendar();
  const deactivate = useDeactivateHolidayCalendar();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<HolidayCalendar | null>(null);
  const [viewingCalId, setViewingCalId] = useState<number | null>(null);
  const [form] = Form.useForm<HolidayCalendarInput>();

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(c: HolidayCalendar) {
    setEditing(c);
    form.setFieldsValue({ calendarCode: c.calendarCode, calendarName: c.calendarName, calendarType: c.calendarType, countryCode: c.countryCode ?? undefined, currencyCode: c.currencyCode ?? undefined, description: c.description ?? undefined, isActive: c.isActive });
    setOpen(true);
  }
  async function submit() { const v = await form.validateFields(); await save.mutateAsync({ id: editing?.calendarId ?? null, input: v }); setOpen(false); }

  const colDefs = useMemo<ColDef<HolidayCalendar>[]>(() => [
    { field: 'calendarCode', headerName: 'Code', cellClass: 'cell-mono', width: 120, pinned: 'left',
      tooltipValueGetter: () => 'Calendar code used in trade/pricing configuration. Standard codes: LON (London), NYC (New York), TOK (Tokyo), NYMEX, LME' },
    { field: 'calendarName', headerName: 'Calendar', flex: 1.4, minWidth: 200 },
    { field: 'calendarType', headerName: 'Type', width: 110, cellRenderer: (p: { value: CalendarType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'countryCode', headerName: 'Country', width: 90, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'currencyCode', headerName: 'CCY', width: 75, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Settlement currency this calendar covers — e.g. USD (Fed), GBP (BoE), EUR (ECB)' },
    { field: 'holidayCount', headerName: 'Holidays', width: 100, cellClass: 'cell-mono',
      tooltipValueGetter: () => 'Total holiday dates across all years in this calendar' },
    { field: 'description', headerName: 'Description', flex: 1, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 115, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: HolidayCalendar }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<CalendarOutlined />} onClick={() => setViewingCalId(p.data.calendarId)} title="View holidays" />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate calendar?" onConfirm={() => deactivate.mutate(p.data.calendarId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Holiday Calendars" description="Banking, commodity, and exchange holiday calendars used for payment date and pricing period calculations." moduleGroup="calendar" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Calendar" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.calendarId)} />

      {viewingCalId != null && <HolidayDrawer calendarId={viewingCalId} onClose={() => setViewingCalId(null)} />}

      <Drawer title={editing ? `Edit Calendar — ${editing.calendarCode}` : 'New Calendar'} open={open} onClose={() => setOpen(false)} width={480}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={submit} loading={save.isPending}>Save</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="calendarCode" label={hint('Calendar Code', 'Short code used in trade pricing configuration, payment date calculations, and settlement. Industry-standard codes: LON (London banking), NYC (Fed/SIFMA), NYMEX, LME, ECB, TOCOM.', 'LON, NYC, NYMEX, LME')} rules={[{ required: true }]}>
            <Input placeholder="LON" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="calendarName" label="Calendar Name" rules={[{ required: true }]}>
            <Input placeholder="London Banking Days" />
          </Form.Item>
          <Form.Item name="calendarType" label={hint('Calendar Type', 'BANKING: central bank and interbank holidays affecting payment dates. COMMODITY: commodity market holidays (LME, NYMEX, ICE). EXCHANGE: venue-specific trading holidays. CUSTOM: bespoke calendar for specific counterparty or bilateral agreement.', 'BANKING')} rules={[{ required: true }]}>
            <Select options={CALENDAR_TYPES.map((t) => ({ label: t, value: t }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="countryCode" label={hint('Country', 'ISO 3166-1 alpha-2 code of the country whose public holidays are included.', 'GB, US, JP')} style={{ flex: 1 }}>
              <Input placeholder="GB" maxLength={2} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="currencyCode" label={hint('Currency', '3-letter ISO currency code — links this calendar to its settlement currency. LON → GBP, NYC → USD, ECB → EUR. Used to determine applicable calendar for FX payments.', 'GBP')} style={{ flex: 1 }}>
              <Input placeholder="GBP" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="UK public holidays and Bank Holidays as observed by the London interbank market" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
