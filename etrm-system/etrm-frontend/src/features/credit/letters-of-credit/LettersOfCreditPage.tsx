import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber,
  Select, Switch, Row, Col, Divider, Typography, Tooltip, Statistic,
} from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useCounterparties, useLegalEntities } from '@features/trade/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useLettersOfCredit, useSaveLetterOfCredit, useCancelLetterOfCredit } from './hooks';
import type { LetterOfCredit, LetterOfCreditInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs, { type Dayjs } from 'dayjs';

const { Text } = Typography;

const LC_TYPE_COLOR: Record<string, string> = {
  STANDBY: 'blue', DOCUMENTARY: 'orange', REVOLVING: 'green', TRANSFERABLE: 'purple',
};
const LC_STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success', EXPIRED: 'default', CANCELLED: 'error',
  PARTIALLY_DRAWN: 'warning', FULLY_DRAWN: 'volcano',
};

function sec(label: string) {
  return (
    <Divider orientation="left" style={{ margin: '14px 0 8px', fontSize: 11, color: '#6b7280' }}>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </Divider>
  );
}

export function LettersOfCreditPage() {
  const { data = [], isLoading, refetch } = useLettersOfCredit();
  const save   = useSaveLetterOfCredit();
  const cancel = useCancelLetterOfCredit();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] }  = useLegalEntities();
  const { data: lcTypeRows = [] }     = useTableRows('lc_type');
  const { data: lcStatusRows = [] }   = useTableRows('lc_status_type');

  type LookupRow = { typeCode: string; typeName: string };
  const lcTypeOpts   = (lcTypeRows   as LookupRow[]).map((r) => ({ value: r.typeCode, label: r.typeName }));
  const lcStatusOpts = (lcStatusRows as LookupRow[]).map((r) => ({ value: r.typeCode, label: r.typeName }));

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<LetterOfCredit | null>(null);
  const [form]                = Form.useForm<LetterOfCreditInput>();
  useFormDraft('credit-lcs', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      lcType: 'STANDBY', status: 'ACTIVE', lcCurrency: 'USD',
      drawdownAmount: 0, issuedAmount: 0, isEvergreen: false,
      issueDate: dayjs(),
    } as unknown as LetterOfCreditInput);
    setOpen(true);
  }

  function openEdit(r: LetterOfCredit) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      issueDate: r.issueDate ? dayjs(r.issueDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
      confirmingBankName: r.confirmingBankName ?? undefined,
      issuingBankBic: r.issuingBankBic ?? undefined,
      presentationDeadlineDays: r.presentationDeadlineDays ?? undefined,
      autoRenewalDays: r.autoRenewalDays ?? undefined,
      placeOfExpiry: r.placeOfExpiry ?? undefined,
      applicableLaw: r.applicableLaw ?? undefined,
    } as unknown as LetterOfCreditInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: LetterOfCreditInput = {
      ...values,
      issueDate: v.issueDate ? v.issueDate.format('YYYY-MM-DD') : values.issueDate,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : values.expiryDate,
    };
    const saved = await save.mutateAsync({ id: editing?.lcId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const cpOpts = useMemo(
    () => (counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[])
      .map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.name}` })),
    [counterparties],
  );
  const leOpts = useMemo(
    () => (legalEntities as { legalEntityId: number; entityCode: string; name: string }[])
      .map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.name}` })),
    [legalEntities],
  );

  // Summary stats
  const totalFaceValue = useMemo(() => data.filter((d) => d.status === 'ACTIVE').reduce((s, d) => s + d.lcAmount, 0), [data]);
  const totalAvailable = useMemo(() => data.filter((d) => d.status === 'ACTIVE').reduce((s, d) => s + d.availableAmount, 0), [data]);
  const totalDrawn     = useMemo(() => data.filter((d) => d.status === 'ACTIVE').reduce((s, d) => s + d.drawdownAmount, 0), [data]);

  const colDefs = useMemo<ColDef<LetterOfCredit>[]>(() => [
    { field: 'lcReference', headerName: 'LC Reference', width: 165, pinned: 'left', cellClass: 'cell-mono' },
    {
      field: 'lcType', headerName: 'Type', width: 120,
      cellRenderer: (p: { value: string }) => <Tag color={LC_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>,
    },
    { field: 'counterpartyName', headerName: 'Applicant (CP)', flex: 1, minWidth: 145 },
    { field: 'issuingBankName', headerName: 'Issuing Bank', flex: 1, minWidth: 130 },
    {
      headerName: 'Face Value', width: 140,
      valueGetter: (p) => `${p.data?.lcCurrency} ${(p.data?.lcAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      headerName: 'Drawn', width: 130,
      valueGetter: (p) => `${p.data?.lcCurrency} ${(p.data?.drawdownAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      headerName: 'Available', width: 130,
      valueGetter: (p) => `${p.data?.lcCurrency} ${(p.data?.availableAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    { field: 'issueDate', headerName: 'Issue Date', width: 100, cellClass: 'cell-mono' },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, cellClass: 'cell-mono' },
    {
      field: 'isEvergreen', headerName: 'Evergreen', width: 90,
      cellRenderer: (p: { value: boolean }) => p.value ? <Tag color="green" style={{ fontSize: 10 }}>YES</Tag> : null,
    },
    {
      field: 'status', headerName: 'Status', width: 125,
      cellRenderer: (p: { value: string }) => <Tag color={LC_STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: LetterOfCredit }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {(p.data.status === 'ACTIVE' || p.data.status === 'PARTIALLY_DRAWN') && (
            <Popconfirm title="Cancel this LC?" onConfirm={() => cancel.mutate(p.data.lcId)} okText="Cancel LC" okButtonProps={{ danger: true }}>
              <Tooltip title="Cancel LC"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [cancel]);

  return (
    <>
      <PageHeader
        title="Letters of Credit"
        description="Standby, documentary and revolving LCs received from or issued for counterparties as credit support. Tracks face value, drawdowns, expiry dates and evergreen renewal provisions."
        moduleGroup="credit"
      />

      {/* Summary band */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 16, padding: '12px 16px', background: 'rgba(22,119,255,0.04)', borderRadius: 6, border: '1px solid rgba(22,119,255,0.12)' }}>
        <Statistic title="Active Face Value (USD)" value={totalFaceValue} precision={0} groupSeparator="," prefix="$" valueStyle={{ fontSize: 16 }} />
        <Statistic title="Available" value={totalAvailable} precision={0} groupSeparator="," prefix="$" valueStyle={{ fontSize: 16, color: '#22c55e' }} />
        <Statistic title="Drawn" value={totalDrawn} precision={0} groupSeparator="," prefix="$" valueStyle={{ fontSize: 16, color: '#ef4444' }} />
        <Statistic title="Active LCs" value={data.filter((d) => d.status === 'ACTIVE').length} valueStyle={{ fontSize: 16 }} />
      </div>

      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New LC"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.lcId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit LC — ${editing.lcReference}` : 'New Letter of Credit'}
        open={open}
        onClose={() => setOpen(false)}
        width={660}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small">

          {sec('LC Identification')}
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="lcReference" label={hint('LC Reference', 'Bank-issued LC number — e.g. LC/2026/001234.')} rules={[{ required: true }]}>
                <Input placeholder="LC/2026/001234" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="lcType" label="LC Type" rules={[{ required: true }]}>
                <Select options={lcTypeOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="counterpartyId" label={hint('Applicant (Counterparty)', 'Who opened this LC — the counterparty providing credit support.')} rules={[{ required: true }]}>
                <Select options={cpOpts} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} placeholder="Select counterparty" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="beneficiaryEntityId" label={hint('Beneficiary (Our Entity)', 'Our legal entity that can draw against this LC.')} rules={[{ required: true }]}>
                <Select options={leOpts} showSearch placeholder="Our legal entity" />
              </Form.Item>
            </Col>
          </Row>

          {sec('Issuing & Confirming Bank')}
          <Row gutter={16}>
            <Col span={14}><Form.Item name="issuingBankName" label="Issuing Bank Name" rules={[{ required: true }]}><Input placeholder="HSBC Bank plc" /></Form.Item></Col>
            <Col span={10}><Form.Item name="issuingBankBic" label={hint('BIC / SWIFT', 'ISO 9362 bank identifier.')}><Input placeholder="HBUKGB4B" style={{ fontFamily: 'monospace' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="confirmingBankName" label={hint('Confirming Bank', 'Optional second bank that adds its guarantee. Leave blank if unconfirmed.')}>
            <Input placeholder="Citibank N.A. (optional)" />
          </Form.Item>

          {sec('Amount & Currency')}
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="lcAmount" label="LC Face Value" rules={[{ required: true }, { type: 'number', min: 0, message: 'Must be 0 or more' }]}>
                <InputNumber style={{ width: '100%' }} placeholder="10000000" min={0 as number} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="lcCurrency" label="Currency" rules={[{ required: true }]}>
                <Input placeholder="USD" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="drawdownAmount"
                label={hint('Drawdown to Date', 'Cumulative amount already drawn. 0 for a fresh LC.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0" min={0 as number} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item
                name="issuedAmount"
                label={hint('Issued Amount', 'For revolving LCs the total issued amount may exceed the face value.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="same as LC amount" min={0 as number} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Dates')}
          <Row gutter={16}>
            <Col span={10}><Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}><AppDatePicker /></Form.Item></Col>
            <Col span={10}>
              <Form.Item
                name="expiryDate"
                label="Expiry Date"
                dependencies={['issueDate']}
                rules={[
                  { required: true },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const issued = getFieldValue('issueDate');
                      if (!value || !issued || !value.isBefore(issued)) return Promise.resolve();
                      return Promise.reject(new Error('Expiry date must be on or after the issue date'));
                    },
                  }),
                ]}
              >
                <AppDatePicker />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="presentationDeadlineDays"
                label={hint('Presentation Deadline', 'Days before expiry within which documents must be presented.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="21" min={0} suffix="days" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="placeOfExpiry" label={hint('Place of Expiry', 'Country or city where the LC expires — e.g. London, Singapore.')}>
                <Input placeholder="London" />
              </Form.Item>
            </Col>
          </Row>

          {sec('Evergreen / Auto-Renewal')}
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="isEvergreen" label={hint('Evergreen', 'Automatically extends unless cancelled within the notice window.')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="autoRenewalDays"
                label={hint('Renewal Notice Window', 'Days before expiry to cancel; otherwise auto-renews. Typically 30–90 days.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="60" min={0} suffix="days before expiry" />
              </Form.Item>
            </Col>
          </Row>

          {sec('Other')}
          <Form.Item name="applicableLaw" label={hint('Applicable Rules', 'UCP 600 for documentary LCs. ISP98 for standby LCs.')}>
            <Input placeholder="UCP 600 / ISP98" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={lcStatusOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Renewal tracking, drawdown history, conditions..." />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
