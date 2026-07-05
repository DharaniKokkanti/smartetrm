import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber,
  Select, Switch, Row, Col, Divider, Typography, Tooltip,
} from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useCounterparties } from '@features/trade/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useMarginAgreements, useSaveMarginAgreement, useDeactivateMarginAgreement } from './hooks';
import type { MarginAgreement, MarginAgreementInput } from './types';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import { useFormDraft } from '@components/smart/formDraft';

const { Text } = Typography;

const AGREEMENT_TYPE_LABELS: Record<string, string> = {
  CSA_BILATERAL:   'CSA Bilateral',
  CSA_ONE_WAY_IN:  'CSA One-Way (In)',
  CSA_ONE_WAY_OUT: 'CSA One-Way (Out)',
  PLEDGE:          'Pledge Agreement',
  CTA:             'CTA',
};
const AGREEMENT_TYPE_COLOR: Record<string, string> = {
  CSA_BILATERAL: 'blue', CSA_ONE_WAY_IN: 'cyan', CSA_ONE_WAY_OUT: 'orange',
  PLEDGE: 'purple', CTA: 'geekblue',
};

function sec(label: string) {
  return (
    <Divider orientation="left" style={{ margin: '14px 0 8px', fontSize: 11, color: '#6b7280' }}>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </Divider>
  );
}

export function MarginAgreementsPage() {
  const { data = [], isLoading, refetch } = useMarginAgreements();
  const save       = useSaveMarginAgreement();
  const deactivate = useDeactivateMarginAgreement();
  const { data: counterparties = [] }        = useCounterparties();
  const { data: agreementTypeRows = [] }     = useTableRows('margin_agreement_type');
  const { data: valuationFreqRows = [] }     = useTableRows('valuation_frequency_type');
  const { data: governingLawRows = [] }      = useTableRows('governing_law_type');

  type LookupRow = { typeCode: string; typeName: string };
  const agreementTypeOpts = (agreementTypeRows as LookupRow[]).map((r) => ({ value: r.typeCode, label: r.typeName }));
  const valuationFreqOpts = (valuationFreqRows as LookupRow[]).map((r) => ({ value: r.typeCode, label: r.typeName }));
  const governingLawOpts  = (governingLawRows  as LookupRow[]).map((r) => ({ value: r.typeCode, label: r.typeName }));

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<MarginAgreement | null>(null);
  const [form]                = Form.useForm<MarginAgreementInput>();
  useFormDraft('credit-margin', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      agreementType: 'CSA_BILATERAL',
      thresholdAmount: 0, thresholdCurrency: 'USD',
      cpThresholdAmount: 0, cpThresholdCurrency: 'USD',
      mtaAmount: 100000, mtaCurrency: 'USD',
      roundingAmount: 1000,
      valuationFrequency: 'DAILY',
      govLaw: 'ENGLISH',
      effectiveDate: dayjs(),
      isActive: true,
    } as unknown as MarginAgreementInput);
    setOpen(true);
  }

  function openEdit(r: MarginAgreement) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      effectiveDate: r.effectiveDate ? dayjs(r.effectiveDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
    } as unknown as MarginAgreementInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: MarginAgreementInput = {
      ...values,
      effectiveDate: v.effectiveDate ? v.effectiveDate.format('YYYY-MM-DD') : values.effectiveDate,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.marginAgreementId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const cpOpts = useMemo(
    () => (counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[])
      .map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.name}` })),
    [counterparties],
  );

  const colDefs = useMemo<ColDef<MarginAgreement>[]>(() => [
    { field: 'agreementCode', headerName: 'Agreement Code', width: 175, pinned: 'left', cellClass: 'cell-mono' },
    {
      field: 'agreementType', headerName: 'Type', width: 155,
      cellRenderer: (p: { value: string }) => (
        <Tag color={AGREEMENT_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>
          {AGREEMENT_TYPE_LABELS[p.value] ?? p.value}
        </Tag>
      ),
    },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 150 },
    {
      headerName: 'Our Threshold', width: 145,
      valueGetter: (p) => `${p.data?.thresholdCurrency} ${(p.data?.thresholdAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      headerName: 'CP Threshold', width: 145,
      valueGetter: (p) => `${p.data?.cpThresholdCurrency} ${(p.data?.cpThresholdAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      headerName: 'MTA', width: 130,
      valueGetter: (p) => `${p.data?.mtaCurrency} ${(p.data?.mtaAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    { field: 'valuationFrequency', headerName: 'Valuation', width: 95 },
    { field: 'govLaw', headerName: 'Gov. Law', width: 100 },
    { field: 'effectiveDate', headerName: 'Effective', width: 100, cellClass: 'cell-mono' },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? 'Perpetual' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: MarginAgreement }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.isActive && (
            <Popconfirm title="Deactivate this agreement?" onConfirm={() => deactivate.mutate(p.data.marginAgreementId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader
        title="Margin Agreements"
        description="Credit Support Annex (CSA) and pledge agreements defining threshold, MTA, eligible collateral and valuation frequency for each counterparty. Used by the margin call engine to calculate collateral obligations."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Agreement"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.marginAgreementId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit — ${editing.agreementCode}` : 'New Margin Agreement'}
        open={open}
        onClose={() => setOpen(false)}
        width={680}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small">

          {sec('Identification')}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="agreementCode" label={hint('Agreement Code', 'Unique reference — e.g. CSA-SHELL-2024, PLEDGE-BP-001.')} rules={[{ required: true }]}>
                <Input placeholder="CSA-SHELL-2024" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="agreementType" label="Agreement Type" rules={[{ required: true }]}>
                <Select options={agreementTypeOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}>
                <Select options={cpOpts} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} placeholder="Select counterparty" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="govLaw" label={hint('Governing Law', 'ENGLISH = ISDA 2002 standard. NEW_YORK = ISDA 1992 / US CSA.')}>
                <Select options={governingLawOpts} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Threshold Amounts')}
          <Row gutter={8}>
            <Col span={14}>
              <Form.Item
                name="thresholdAmount"
                label={hint('Our Threshold', 'If MTM exposure > this amount, counterparty must post collateral to us.')}
                rules={[{ required: true }, { type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0" min={0 as number} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="thresholdCurrency" label="Currency" rules={[{ required: true }]}>
                <Input placeholder="USD" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={14}>
              <Form.Item
                name="cpThresholdAmount"
                label={hint('CP Threshold', 'If MTM exposure < −this amount, we must post collateral to counterparty.')}
                rules={[{ required: true }, { type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0" min={0 as number} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="cpThresholdCurrency" label="Currency" rules={[{ required: true }]}>
                <Input placeholder="USD" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Transfer Rules')}
          <Row gutter={8}>
            <Col span={14}>
              <Form.Item
                name="mtaAmount"
                label={hint('MTA — Minimum Transfer Amount', 'Collateral call only triggered if call amount > MTA. Prevents small / frequent calls.')}
                rules={[{ required: true }, { type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="100000" min={0 as number} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="mtaCurrency" label="Currency" rules={[{ required: true }]}>
                <Input placeholder="USD" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={8}>
            <Col span={14}>
              <Form.Item
                name="roundingAmount"
                label={hint('Rounding Amount', 'Call amount is rounded to nearest multiple of this value — typically USD 1,000.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="1000" min={0} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="valuationFrequency" label={hint('Valuation', 'How often MTM is calculated and compared to threshold.')} rules={[{ required: true }]}>
                <Select options={valuationFreqOpts} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Independent Amount (Initial Margin)')}
          <Row gutter={8}>
            <Col span={14}>
              <Form.Item
                name="independentAmount"
                label={hint('Independent Amount', 'Upfront margin posted regardless of MTM. Used for riskier counterparties.')}
                rules={[{ type: 'number', min: 0, message: 'Must be 0 or more' }]}
              >
                <InputNumber style={{ width: '100%' }} placeholder="0 (none)" min={0 as number} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="independentAmountCurrency" label="Currency">
                <Input placeholder="USD" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Collateral & Eligibility')}
          <Form.Item name="eligibleCollateral" label={hint('Eligible Collateral', 'Cash USD, EUR; Govies (AAA–AA, <10yr maturity); Gold bars.')}>
            <Input.TextArea rows={2} placeholder="Cash (USD, EUR); G7 Government Bonds AAA–AA rated; Gold" />
          </Form.Item>
          <Form.Item name="eligibleCurrencies" label="Eligible Currencies">
            <Input placeholder="USD, EUR, GBP" />
          </Form.Item>

          {sec('Dates & Status')}
          <Row gutter={16}>
            <Col span={10}><Form.Item name="effectiveDate" label="Effective Date" rules={[{ required: true }]}><AppDatePicker /></Form.Item></Col>
            <Col span={10}>
              <Form.Item
                name="expiryDate"
                label={hint('Expiry Date', 'Leave blank for perpetual / no fixed term.')}
                dependencies={['effectiveDate']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const eff = getFieldValue('effectiveDate');
                      if (!value || !eff || !value.isBefore(eff)) return Promise.resolve();
                      return Promise.reject(new Error('Expiry date must be on or after the effective date'));
                    },
                  }),
                ]}
              >
                <AppDatePicker placeholder="Perpetual" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Any additional terms or internal notes..." />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
