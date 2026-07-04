import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber,
  Select, Switch, Row, Col, Divider, Typography, Tooltip, Progress, Timeline, Empty,
} from 'antd';
import { EditOutlined, PauseCircleOutlined, PlayCircleOutlined, PlusOutlined, MinusCircleOutlined, BellOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useCounterparties } from '@features/trade/hooks';
import { useSystemUsers } from '@features/admin/system-users/hooks';
import { COMMODITY_TYPES } from '@features/organization/desks/types';
import { useCreditLimits, useSaveCreditLimit, useSuspendCreditLimit, useReinstateCreditLimit } from './hooks';
import type { CreditLimit, CreditLimitInput } from './types';
import {
  CREDIT_LIMIT_TYPES, CREDIT_LIMIT_STATUSES, LIMIT_BASIS_TYPES, INSTRUMENT_CLASSES,
  REVIEW_OUTCOMES, COUNTRY_RISK_RATINGS, BREACH_ACTIONS,
} from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs, { type Dayjs } from 'dayjs';

const { Text } = Typography;

const LIMIT_TYPE_COLOR: Record<string, string> = {
  SETTLEMENT: 'blue', PRE_SETTLEMENT: 'geekblue', DELIVERY: 'orange', MARK_TO_MARKET: 'purple', TOTAL_AGGREGATE: 'magenta',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success', UNDER_REVIEW: 'processing', EXPIRED: 'default', SUSPENDED: 'warning', CANCELLED: 'error',
};
const INDICATOR_COLOR: Record<string, string> = {
  OK: 'success', WARNING: 'warning', CRITICAL: 'volcano', BREACHED: 'error',
};
const COUNTRY_RISK_COLOR: Record<string, string> = {
  LOW: 'green', MEDIUM: 'gold', HIGH: 'volcano', SEVERE: 'red',
};
const ALERT_TYPE_COLOR: Record<string, string> = {
  WARNING_THRESHOLD: 'gold', CRITICAL_THRESHOLD: 'volcano', BREACH: 'red',
  REVIEW_DUE: 'blue', EXPIRY_APPROACHING: 'orange', STATUS_CHANGE: 'purple',
};

function sec(label: string) {
  return (
    <Divider orientation="left" style={{ margin: '14px 0 8px', fontSize: 11, color: '#6b7280' }}>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </Divider>
  );
}

const numFmt = {
  formatter: (v: unknown) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  parser: (v: string | undefined) => v?.replace(/,/g, '') as unknown as number,
};

export function CreditLimitsPage() {
  const { data = [], isLoading, refetch } = useCreditLimits();
  const save       = useSaveCreditLimit();
  const suspend    = useSuspendCreditLimit();
  const reinstate  = useReinstateCreditLimit();
  const { data: counterparties = [] } = useCounterparties();
  const { data: users = [] }          = useSystemUsers();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<CreditLimit | null>(null);
  const [form]                = Form.useForm<CreditLimitInput>();
  useFormDraft('credit-limits', { form, open, setOpen, editing, setEditing });

  const watchedBasis     = Form.useWatch('limitBasis', form);
  const watchedAlertCp   = Form.useWatch('alertCounterparty', form);
  const watchedCpId      = Form.useWatch('counterpartyId', form);

  type CpRow = { counterpartyId: number; counterpartyCode: string; name: string; countryCode?: string };
  const cpRows = counterparties as CpRow[];
  const cpOpts = useMemo(
    () => cpRows.map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.name}` })),
    [cpRows],
  );
  type UserRow = { userId: number; fullName: string; role: string };
  const analystOpts = useMemo(
    () => (users as UserRow[])
      .filter((u) => u.role === 'CREDIT_ANALYST' || u.role === 'RISK_MANAGER' || u.role === 'ADMIN')
      .map((u) => ({ value: u.userId, label: `${u.fullName}${u.role === 'CREDIT_ANALYST' ? '' : ` (${u.role.replace('_', ' ')})`}` })),
    [users],
  );
  // parent options: umbrella limits of the same counterparty (or any DIRECT limit), excluding self
  const parentLimitOpts = useMemo(
    () => data
      .filter((l) => l.limitBasis === 'DIRECT' && l.creditLimitId !== editing?.creditLimitId
        && (watchedCpId == null || l.counterpartyId === watchedCpId))
      .map((l) => ({ value: l.creditLimitId, label: `#${l.creditLimitId} ${l.counterpartyName} — ${l.limitType.replace(/_/g, ' ')} ${l.limitCurrency} ${l.limitAmount.toLocaleString()}` })),
    [data, editing, watchedCpId],
  );

  const commodityOpts = [{ value: 'ALL', label: 'ALL — umbrella' }, ...COMMODITY_TYPES.map((c) => ({ value: c, label: c }))];

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      limitType: 'PRE_SETTLEMENT', limitBasis: 'DIRECT', commodityType: 'ALL',
      limitCurrency: 'USD', usedAmount: 0, collateralOffset: 0,
      warningThresholdPct: 80, criticalThresholdPct: 95, breachAction: 'ALERT_ONLY',
      alertInternal: true, alertCounterparty: false,
      reviewFrequencyDays: 365,
      status: 'ACTIVE', isActive: true,
      effectiveDate: dayjs(),
      lineItems: [],
    } as unknown as CreditLimitInput);
    setOpen(true);
  }

  function openEdit(r: CreditLimit) {
    setEditing(r);
    form.resetFields();
    form.setFieldsValue({
      ...r,
      effectiveDate: r.effectiveDate ? dayjs(r.effectiveDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
      approvedBy: r.approvedBy ?? undefined,
      approvalDate: r.approvalDate ? dayjs(r.approvalDate) : undefined,
      lastReviewDate: r.lastReviewDate ? dayjs(r.lastReviewDate) : undefined,
      nextReviewDate: r.nextReviewDate ? dayjs(r.nextReviewDate) : undefined,
      tempUpliftExpiry: r.tempUpliftExpiry ? dayjs(r.tempUpliftExpiry) : undefined,
      nettingAgreementRef: r.nettingAgreementRef ?? undefined,
      lineItems: r.lineItems ?? [],
    } as unknown as CreditLimitInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: CreditLimitInput = {
      ...values,
      effectiveDate: v.effectiveDate ? v.effectiveDate.format('YYYY-MM-DD') : values.effectiveDate,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : null,
      approvalDate: v.approvalDate ? v.approvalDate.format('YYYY-MM-DD') : null,
      lastReviewDate: v.lastReviewDate ? v.lastReviewDate.format('YYYY-MM-DD') : null,
      nextReviewDate: v.nextReviewDate ? v.nextReviewDate.format('YYYY-MM-DD') : null,
      tempUpliftExpiry: v.tempUpliftExpiry ? v.tempUpliftExpiry.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.creditLimitId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  // auto-fill country when counterparty changes
  function onCpChange(cpId: number) {
    const cp = cpRows.find((c) => c.counterpartyId === cpId);
    if (cp?.countryCode) form.setFieldValue('cpCountryCode', cp.countryCode);
  }

  const today = new Date().toISOString().slice(0, 10);

  const colDefs = useMemo<ColDef<CreditLimit>[]>(() => [
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 170, pinned: 'left' },
    {
      field: 'cpCountryCode', headerName: 'Ctry', width: 70,
      cellRenderer: (p: { data: CreditLimit }) => p.data.cpCountryCode
        ? <Tooltip title={`Country risk: ${p.data.countryRiskRating ?? '—'}`}>
            <Tag color={COUNTRY_RISK_COLOR[p.data.countryRiskRating ?? ''] ?? 'default'} style={{ fontSize: 10, fontFamily: 'monospace' }}>{p.data.cpCountryCode}</Tag>
          </Tooltip>
        : '—',
    },
    {
      field: 'commodityType', headerName: 'Commodity', width: 100,
      cellRenderer: (p: { value: string }) => <Tag style={{ fontSize: 10 }}>{p.value}</Tag>,
    },
    {
      field: 'limitType', headerName: 'Limit Type', width: 140,
      cellRenderer: (p: { data: CreditLimit }) => (
        <Space size={2}>
          <Tag color={LIMIT_TYPE_COLOR[p.data.limitType] ?? 'default'} style={{ fontSize: 10 }}>{p.data.limitType.replace(/_/g, ' ')}</Tag>
          {p.data.limitBasis === 'ALLOCATED' && <Tooltip title={`Allocated from limit #${p.data.parentLimitId}`}><Tag color="cyan" style={{ fontSize: 9 }}>ALLOC</Tag></Tooltip>}
        </Space>
      ),
    },
    {
      headerName: 'Limit', width: 140,
      valueGetter: (p) => `${p.data?.limitCurrency} ${(p.data?.limitAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      headerName: 'Utilisation', width: 170,
      cellRenderer: (p: { data: CreditLimit }) => {
        const pct = p.data.utilisationPct ?? 0;
        const color = pct >= (p.data.criticalThresholdPct ?? 95) ? '#ff4d4f' : pct >= (p.data.warningThresholdPct ?? 80) ? '#faad14' : '#52c41a';
        return (
          <div style={{ paddingTop: 4 }}>
            <Progress percent={Math.min(pct, 100)} size="small" strokeColor={color} format={() => `${pct.toFixed(1)}%`} />
          </div>
        );
      },
    },
    {
      headerName: 'Available', width: 130,
      valueGetter: (p) => `${p.data?.limitCurrency} ${(p.data?.availableAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    { field: 'creditAnalystName', headerName: 'Analyst', width: 115, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'nextReviewDate', headerName: 'Next Review', width: 110, cellClass: 'cell-mono',
      cellRenderer: (p: { value: string | null }) => p.value
        ? <span style={{ color: p.value < today ? '#ff4d4f' : undefined, fontWeight: p.value < today ? 600 : undefined }}>{p.value}{p.value < today ? ' ⚠' : ''}</span>
        : '—',
    },
    {
      field: 'limitIndicator', headerName: 'Health', width: 95,
      cellRenderer: (p: { value: string }) => <Tag color={INDICATOR_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>,
    },
    {
      field: 'status', headerName: 'Status', width: 115,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    {
      field: 'isActive', headerName: 'Active', width: 75,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 110, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: CreditLimit }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.status === 'ACTIVE' && (
            <Popconfirm title="Suspend this credit limit?" onConfirm={() => suspend.mutate(p.data.creditLimitId)} okText="Suspend" okButtonProps={{ danger: true }}>
              <Tooltip title="Suspend"><Button type="text" size="small" danger icon={<PauseCircleOutlined />} /></Tooltip>
            </Popconfirm>
          )}
          {p.data.status === 'SUSPENDED' && (
            <Tooltip title="Reinstate">
              <Button type="text" size="small" icon={<PlayCircleOutlined />} style={{ color: '#22c55e' }} onClick={() => reinstate.mutate(p.data.creditLimitId)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ], [suspend, reinstate, today]);

  return (
    <>
      <PageHeader
        title="Credit Limits"
        description="Counterparty credit limits by risk type, commodity and instrument class. Direct and group-allocated limits with analyst-owned review cycles, collateral offsets, temporary uplifts and threshold-based alerting — internal and to the counterparty."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Credit Limit"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.creditLimitId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Credit Limit — ${editing.counterpartyName} (${editing.limitType.replace(/_/g, ' ')})` : 'New Credit Limit'}
        open={open}
        onClose={() => setOpen(false)}
        width={1040}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small">
          <Row gutter={28}>
          <Col span={12} style={{ borderRight: '1px solid rgba(125,125,125,0.15)' }}>

          {sec('Counterparty & Scope')}
          <Row gutter={12}>
            <Col span={16}>
              <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}>
                <Select options={cpOpts} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} placeholder="Select counterparty" onChange={onCpChange} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="cpCountryCode" label={hint('Country', 'ISO country of the counterparty — auto-filled from the counterparty record. Drives country risk.')}>
                <Input maxLength={2} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} placeholder="GB" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="countryRiskRating" label={hint('Ctry Risk', 'Sovereign / transfer risk band. HIGH and SEVERE shorten review cycles and cap tenor.')}>
                <Select options={COUNTRY_RISK_RATINGS.map((r) => ({ value: r, label: r }))} allowClear placeholder="LOW" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="limitType" label={hint('Limit Type', 'PRE_SETTLEMENT = potential future exposure on open trades. SETTLEMENT = payments falling due. DELIVERY = cargo released before payment. MARK_TO_MARKET = current replacement cost. TOTAL_AGGREGATE = umbrella cap across all types.')} rules={[{ required: true }]}>
                <Select options={CREDIT_LIMIT_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="limitBasis" label={hint('Basis', 'DIRECT = granted on the counterparty’s own standing. ALLOCATED = carved from a parent / group umbrella limit.')} rules={[{ required: true }]}>
                <Select options={LIMIT_BASIS_TYPES.map((b) => ({ value: b, label: b }))} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="commodityType" label={hint('Commodity', 'Scope the limit to one commodity, or ALL for an umbrella limit.')} rules={[{ required: true }]}>
                <Select options={commodityOpts} showSearch />
              </Form.Item>
            </Col>
          </Row>
          {watchedBasis === 'ALLOCATED' && (
            <Form.Item name="parentLimitId" label={hint('Parent Limit', 'The group umbrella this allocation is carved from. Child allocations must not exceed the parent cap.')} rules={[{ required: true, message: 'Allocated limits need a parent' }]}>
              <Select options={parentLimitOpts} placeholder="Select parent umbrella limit" />
            </Form.Item>
          )}

          {sec('Limit & Collateral')}
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="limitAmount" label="Limit Amount" rules={[{ required: true }]}>
                <InputNumber<number> style={{ width: '100%' }} placeholder="50,000,000" {...numFmt} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="limitCurrency" label="Currency" rules={[{ required: true }]}>
                <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="usedAmount" label={hint('Used', 'Current utilisation — auto-updated by the exposure engine; 0 for new limits.')}>
                <InputNumber<number> style={{ width: '100%' }} placeholder="0" {...numFmt} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="collateralOffset" label={hint('Collateral Offset', 'Value of LCs / parent guarantees held — increases effective capacity.')}>
                <InputNumber<number> style={{ width: '100%' }} placeholder="0" {...numFmt} />
              </Form.Item>
            </Col>
            <Col span={14}>
              <Form.Item name="collateralRef" label="Collateral Ref">
                <Input placeholder="LC-2026-0007 / PCG-SHELL-01" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={10}>
              <Form.Item name="tempUpliftAmount" label={hint('Temp Uplift', 'Temporary increase on top of the limit — e.g. for a seasonal cargo programme. Falls away at expiry.')}>
                <InputNumber<number> style={{ width: '100%' }} placeholder="—" {...numFmt} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="tempUpliftExpiry" label="Uplift Expiry">
                <AppDatePicker />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="tenorCapMonths" label={hint('Tenor Cap', 'Longest deal tenor (months) bookable under this limit.')}>
                <InputNumber<number> style={{ width: '100%' }} placeholder="12" min={1} max={120} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Validity')}
          <Row gutter={12}>
            <Col span={10}><Form.Item name="effectiveDate" label="Effective Date" rules={[{ required: true }]}><AppDatePicker /></Form.Item></Col>
            <Col span={10}><Form.Item name="expiryDate" label={hint('Expiry Date', 'Leave blank for evergreen / no fixed term.')}><AppDatePicker /></Form.Item></Col>
          </Row>

          </Col>
          <Col span={12}>

          {sec('Governance & Review')}
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="creditAnalystUserId" label={hint('Credit Analyst', 'Analyst who owns this counterparty relationship — receives review and threshold alerts.')}>
                <Select options={analystOpts} allowClear placeholder="Assign analyst" showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="approvedBy" label="Approved By"><Input placeholder="Credit Committee" /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="approvalDate" label="Approval Date"><AppDatePicker /></Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="reviewFrequencyDays" label={hint('Review Cycle', 'Days between scheduled credit reviews. Weak ratings and HIGH country risk warrant 90-day cycles.')}>
                <Select allowClear options={[
                  { value: 30, label: '30 days' }, { value: 90, label: '90 days' },
                  { value: 180, label: '180 days' }, { value: 365, label: '365 days' },
                ]} placeholder="365" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="lastReviewDate" label="Last Review"><AppDatePicker /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="nextReviewDate" label={hint('Next Review', 'Leave blank to auto-derive: last review + review cycle.')}>
                <AppDatePicker placeholder="auto" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="lastReviewOutcome" label="Outcome">
                <Select options={REVIEW_OUTCOMES.map((o) => ({ value: o, label: o }))} allowClear placeholder="—" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="internalRating" label={hint('Internal Rating', 'Internal credit grade assigned at review — IR-1 (strongest) to IR-6.')}>
                <Input placeholder="IR-2" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="externalRating" label={hint('External Rating', 'S&P / Moody’s / Fitch — e.g. AA-, Baa1, BB+.')}>
                <Input placeholder="AA-" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="nettingAgreementRef" label={hint('Netting Agreement', 'ISDA / EFET master reference — netting reduces gross exposure.')}>
                <Input placeholder="ISDA-2002-SHELL-001" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Monitoring & Alerts')}
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="warningThresholdPct" label={hint('Warning %', 'Utilisation crossing this % raises a WARNING alert.')} rules={[{ required: true }]}>
                <InputNumber<number> style={{ width: '100%' }} min={1} max={100} placeholder="80" suffix="%" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="criticalThresholdPct" label={hint('Critical %', 'Utilisation crossing this % raises a CRITICAL alert.')} rules={[{ required: true }]}>
                <InputNumber<number> style={{ width: '100%' }} min={1} max={100} placeholder="95" suffix="%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="breachAction" label={hint('On Breach', 'What happens at 100% utilisation. BLOCK_NEW_TRADES is the standard — existing book stands, new deals rejected.')} rules={[{ required: true }]}>
                <Select options={BREACH_ACTIONS.map((a) => ({ value: a, label: a.replace(/_/g, ' ') }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={6}>
              <Form.Item name="alertInternal" label={hint('Alert Internal', 'Notify the credit analyst and desk on threshold / review / expiry events.')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="alertCounterparty" label={hint('Alert CP', 'Also send limit status notices to the counterparty’s credit desk — used for collateral top-up requests and utilisation warnings.')} valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            {watchedAlertCp && (
              <Col span={12}>
                <Form.Item name="cpAlertEmail" label="CP Credit Desk Email" rules={[{ required: true, type: 'email', message: 'Valid email needed to alert the counterparty' }]}>
                  <Input placeholder="credit.desk@counterparty.com" />
                </Form.Item>
              </Col>
            )}
          </Row>

          {sec('Status & Notes')}
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={CREDIT_LIMIT_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="notes" label="Notes">
                <Input.TextArea rows={2} placeholder="Committee conditions, covenants, watch items..." />
              </Form.Item>
            </Col>
          </Row>

          </Col>
          </Row>

          {sec('Sub-Limits by Instrument Class')}
          <Form.List name="lineItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name }) => (
                  <Row gutter={8} key={key} style={{ marginBottom: 6 }} align="middle">
                    <Col span={5}>
                      <Form.Item name={[name, 'instrumentClass']} rules={[{ required: true, message: 'Class required' }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="Instrument class" options={INSTRUMENT_CLASSES.map((c) => ({ value: c, label: c.replace(/_/g, ' & ') }))} />
                      </Form.Item>
                    </Col>
                    <Col span={5}>
                      <Form.Item name={[name, 'subLimitAmount']} rules={[{ required: true, message: 'Amount required' }]} style={{ marginBottom: 0 }}>
                        <InputNumber<number> placeholder="Sub-limit" style={{ width: '100%' }} {...numFmt} />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item name={[name, 'usedAmount']} style={{ marginBottom: 0 }}>
                        <InputNumber<number> placeholder="Used" style={{ width: '100%' }} {...numFmt} />
                      </Form.Item>
                    </Col>
                    <Col span={3}>
                      <Form.Item name={[name, 'tenorCapMonths']} style={{ marginBottom: 0 }}>
                        <InputNumber<number> placeholder="Tenor (m)" style={{ width: '100%' }} min={1} max={120} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name={[name, 'notes']} style={{ marginBottom: 0 }}>
                        <Input placeholder="Notes" />
                      </Form.Item>
                    </Col>
                    <Col span={1}>
                      <MinusCircleOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f', cursor: 'pointer', fontSize: 16 }} />
                    </Col>
                  </Row>
                ))}
                <Button type="dashed" onClick={() => add({ instrumentClass: null, subLimitAmount: null, usedAmount: 0, tenorCapMonths: null, notes: null })} icon={<PlusOutlined />} size="small" style={{ marginTop: 4 }}>
                  Add Sub-Limit
                </Button>
                {fields.length === 0 && (
                  <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                    Carve the master limit by instrument class — e.g. $60M physical, $25M swaps, $10M OTC options.
                  </Text>
                )}
              </>
            )}
          </Form.List>

          {editing && (editing.alerts?.length ?? 0) > 0 && (
            <>
              {sec('Alert History')}
              <Timeline
                style={{ marginTop: 8 }}
                items={(editing.alerts ?? []).map((a) => ({
                  dot: <BellOutlined style={{ fontSize: 12 }} />,
                  color: a.alertType === 'BREACH' || a.alertType === 'CRITICAL_THRESHOLD' ? 'red' : a.alertType === 'WARNING_THRESHOLD' ? 'orange' : 'blue',
                  children: (
                    <Space direction="vertical" size={0}>
                      <Space size={6}>
                        <Tag color={ALERT_TYPE_COLOR[a.alertType]} style={{ fontSize: 10 }}>{a.alertType.replace(/_/g, ' ')}</Tag>
                        <Tag style={{ fontSize: 10 }}>{a.recipients}</Tag>
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{a.sentAt.replace('T', ' ').slice(0, 16)}</Text>
                      </Space>
                      <Text style={{ fontSize: 12 }}>{a.message}</Text>
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {a.acknowledgedBy ? `Acknowledged by ${a.acknowledgedBy} at ${a.acknowledgedAt?.replace('T', ' ').slice(0, 16)}` : 'Unacknowledged'}
                      </Text>
                    </Space>
                  ),
                }))}
              />
            </>
          )}
          {editing && (editing.alerts?.length ?? 0) === 0 && (
            <>
              {sec('Alert History')}
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No alerts recorded for this limit" style={{ margin: '8px 0' }} />
            </>
          )}
        </Form>
      </Drawer>
    </>
  );
}
