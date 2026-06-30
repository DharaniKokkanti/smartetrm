import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber,
  Select, Switch, Row, Col, Divider, Typography, Tooltip, Progress,
} from 'antd';
import { EditOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useCounterparties } from '@features/trade/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useCreditLimits, useSaveCreditLimit, useSuspendCreditLimit, useReinstateCreditLimit } from './hooks';
import type { CreditLimit, CreditLimitInput } from './types';

const { Text } = Typography;

const LIMIT_TYPE_COLOR: Record<string, string> = {
  SETTLEMENT: 'blue', PRE_SETTLEMENT: 'geekblue', DELIVERY: 'orange', MARK_TO_MARKET: 'purple',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success', EXPIRED: 'default', SUSPENDED: 'warning', CANCELLED: 'error',
};

function sec(label: string) {
  return (
    <Divider orientation="left" style={{ margin: '14px 0 8px', fontSize: 11, color: '#6b7280' }}>
      <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</Text>
    </Divider>
  );
}

export function CreditLimitsPage() {
  const { data = [], isLoading, refetch } = useCreditLimits();
  const save       = useSaveCreditLimit();
  const suspend    = useSuspendCreditLimit();
  const reinstate  = useReinstateCreditLimit();
  const { data: counterparties = [] }    = useCounterparties();
  const { data: limitTypeRows = [] }     = useTableRows('credit_limit_type');
  const { data: limitStatusRows = [] }   = useTableRows('credit_limit_status_type');

  type LookupRow = { typeCode: string; typeName: string };
  const limitTypeOpts   = (limitTypeRows   as LookupRow[]).map((r) => ({ value: r.typeCode, label: r.typeName }));
  const limitStatusOpts = (limitStatusRows as LookupRow[]).map((r) => ({ value: r.typeCode, label: r.typeName }));

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<CreditLimit | null>(null);
  const [form]                = Form.useForm<CreditLimitInput>();

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      limitType: 'PRE_SETTLEMENT', limitCurrency: 'USD',
      usedAmount: 0, status: 'ACTIVE', isActive: true,
      effectiveDate: new Date().toISOString().slice(0, 10),
    });
    setOpen(true);
  }

  function openEdit(r: CreditLimit) {
    setEditing(r);
    form.setFieldsValue({ ...r, expiryDate: r.expiryDate ?? undefined, approvedBy: r.approvedBy ?? undefined, approvalDate: r.approvalDate ?? undefined, nettingAgreementRef: r.nettingAgreementRef ?? undefined });
    setOpen(true);
  }

  async function submit() {
    const values = await form.validateFields();
    await save.mutateAsync({ id: editing?.creditLimitId ?? null, input: values });
    setOpen(false);
  }

  const cpOpts = useMemo(
    () => (counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[])
      .map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.name}` })),
    [counterparties],
  );

  const colDefs = useMemo<ColDef<CreditLimit>[]>(() => [
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 160, pinned: 'left' },
    {
      field: 'limitType', headerName: 'Limit Type', width: 155,
      cellRenderer: (p: { value: string }) => <Tag color={LIMIT_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    {
      headerName: 'Limit', width: 150,
      valueGetter: (p) => `${p.data?.limitCurrency} ${(p.data?.limitAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    {
      headerName: 'Used / Available', width: 190,
      cellRenderer: (p: { data: CreditLimit }) => {
        const pct = p.data.utilisationPct ?? 0;
        const color = pct >= 90 ? '#ff4d4f' : pct >= 70 ? '#faad14' : '#52c41a';
        return (
          <div style={{ paddingTop: 4 }}>
            <Progress
              percent={Math.min(pct, 100)} size="small" strokeColor={color}
              format={() => `${pct.toFixed(1)}%`}
            />
          </div>
        );
      },
    },
    {
      headerName: 'Available', width: 140,
      valueGetter: (p) => `${p.data?.limitCurrency} ${(p.data?.availableAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    { field: 'effectiveDate', headerName: 'Effective', width: 100, cellClass: 'cell-mono' },
    { field: 'expiryDate', headerName: 'Expiry', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'approvedBy', headerName: 'Approved By', width: 110, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'status', headerName: 'Status', width: 100,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>,
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
  ], [suspend, reinstate]);

  return (
    <>
      <PageHeader
        title="Credit Limits"
        description="Pre-settlement, settlement and mark-to-market credit limits per counterparty. Utilisation is tracked in real time against outstanding trade exposure. Limits approaching threshold trigger credit alert workflows."
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

      <Drawer
        title={editing ? `Edit Credit Limit — ${editing.counterpartyName}` : 'New Credit Limit'}
        open={open}
        onClose={() => setOpen(false)}
        width={620}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small">

          {sec('Counterparty & Limit Type')}
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}>
                <Select options={cpOpts} showSearch filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())} placeholder="Select counterparty" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="limitType" label={hint('Limit Type', 'PRE_SETTLEMENT = future exposure on open trades. SETTLEMENT = payment owed today. DELIVERY = physical delivery risk. MARK_TO_MARKET = current unrealised P&L.')} rules={[{ required: true }]}>
                <Select options={limitTypeOpts} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Limit Amount')}
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="limitAmount" label="Limit Amount" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="50000000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="limitCurrency" label="Currency" rules={[{ required: true }]}>
                <Input placeholder="USD" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="usedAmount" label={hint('Used Amount', 'Current utilisation — auto-updated by the system; enter 0 for new limits.')}>
                <InputNumber style={{ width: '100%' }} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
          </Row>

          {sec('Validity')}
          <Row gutter={16}>
            <Col span={10}><Form.Item name="effectiveDate" label="Effective Date" rules={[{ required: true }]}><Input placeholder="2026-01-01" /></Form.Item></Col>
            <Col span={10}><Form.Item name="expiryDate" label="Expiry Date"><Input placeholder="Leave blank = no expiry" /></Form.Item></Col>
          </Row>

          {sec('Approval')}
          <Row gutter={16}>
            <Col span={12}><Form.Item name="approvedBy" label="Approved By"><Input placeholder="Credit Officer name" /></Form.Item></Col>
            <Col span={12}><Form.Item name="approvalDate" label="Approval Date"><Input placeholder="2026-06-01" /></Form.Item></Col>
          </Row>
          <Form.Item name="nettingAgreementRef" label={hint('Netting Agreement Ref', 'ISDA / EFET master agreement reference. Netting reduces gross exposure.')}>
            <Input placeholder="ISDA-2002-SHELL-001" style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          {sec('Status & Notes')}
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={limitStatusOpts} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Credit committee notes, conditions, review dates..." />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
