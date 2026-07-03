import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber,
  Card, Table, Divider, Typography, Row, Col, Tooltip, Badge, Empty, Alert,
} from 'antd';
import {
  EditOutlined, StopOutlined, CheckCircleOutlined, PlusOutlined,
  DeleteOutlined, FileDoneOutlined, WarningOutlined,
} from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import {
  useBolmoAgreements, useBolmoLegs, useSaveBolmoAgreement,
  useAgreeBolmo, useCompleteBolmo, useDisputeBolmo, useCancelBolmo,
  useAddBolmoLeg, useDeleteBolmoLeg,
} from './hooks';
import type { BolmoAgreement, BolmoAgreementInput, BolmoLegInput, BolmoStatus } from './types';
import { BOLMO_STATUSES, BOLMO_DIRECTIONS } from './types';
import { useCounterparties, useLegalEntities } from '@features/trade/hooks';
import { COMMODITY_TYPES_TRADE } from '@features/trade/types';
import { useFormDraft } from '@components/smart/formDraft';

const { Text } = Typography;

const STATUS_COLOR: Record<BolmoStatus, string> = {
  PENDING: 'warning', AGREED: 'blue', COMPLETED: 'success', DISPUTED: 'error', CANCELLED: 'default',
};

const DIRECTION_COLOR: Record<string, string> = { BUY: 'green', SELL: 'red' };

function statusTag(s: BolmoStatus) {
  const icons: Partial<Record<BolmoStatus, React.ReactNode>> = {
    AGREED: <CheckCircleOutlined />, COMPLETED: <FileDoneOutlined />, DISPUTED: <WarningOutlined />,
  };
  return <Tag color={STATUS_COLOR[s]} icon={icons[s]} style={{ fontSize: 10 }}>{s}</Tag>;
}

export function BolmoAgreementsPage() {
  const { data: agreements = [], isLoading, refetch } = useBolmoAgreements();
  const saveAgreement = useSaveBolmoAgreement();
  const agree     = useAgreeBolmo();
  const complete  = useCompleteBolmo();
  const dispute   = useDisputeBolmo();
  const cancel    = useCancelBolmo();

  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities  = [] } = useLegalEntities();

  // ── selected agreement for legs panel ──
  const [selectedBolmoId, setSelectedBolmoId] = useState<number | null>(null);
  const selectedAgreement = useMemo(
    () => agreements.find((a) => a.bolmoId === selectedBolmoId) ?? null,
    [agreements, selectedBolmoId],
  );

  const { data: legs = [] } = useBolmoLegs(selectedBolmoId);
  const addLeg    = useAddBolmoLeg(selectedBolmoId);
  const deleteLeg = useDeleteBolmoLeg(selectedBolmoId);

  // ── agreement drawer ──
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<BolmoAgreement | null>(null);
  const [agForm] = Form.useForm<BolmoAgreementInput>();
  useFormDraft('bolmo-agreement', { form: agForm, open: drawerOpen, setOpen: setDrawerOpen, editing, setEditing });

  // ── leg drawer ──
  const [legDrawerOpen, setLegDrawerOpen] = useState(false);
  const [legForm] = Form.useForm<BolmoLegInput>();
  useFormDraft('bolmo-leg', { form: legForm, open: legDrawerOpen, setOpen: setLegDrawerOpen });

  function openNew() {
    setEditing(null);
    agForm.resetFields();
    agForm.setFieldsValue({ status: 'PENDING', currencyCode: 'USD', uomCode: 'BBL' });
    setDrawerOpen(true);
  }
  function openEdit(a: BolmoAgreement) {
    setEditing(a);
    agForm.setFieldsValue({
      counterpartyId: a.counterpartyId, legalEntityId: a.legalEntityId,
      agreementDate: a.agreementDate, settlementDate: a.settlementDate ?? undefined,
      commodityType: a.commodityType, deliveryLocationCode: a.deliveryLocationCode ?? undefined,
      deliveryPeriodCode: a.deliveryPeriodCode ?? undefined,
      netQuantity: a.netQuantity, uomCode: a.uomCode,
      nettingPrice: a.nettingPrice ?? undefined, currencyCode: a.currencyCode,
      status: a.status, notes: a.notes ?? undefined,
    });
    setDrawerOpen(true);
  }
  async function submitAgreement(closeAfter = true) {
    const v = await agForm.validateFields();
    const saved = await saveAgreement.mutateAsync({ id: editing?.bolmoId ?? null, input: v });
    if (closeAfter) setDrawerOpen(false); else setEditing(saved);
  }

  function openAddLeg() {
    legForm.resetFields();
    legForm.setFieldsValue({ bolmoId: selectedBolmoId ?? 0, direction: 'BUY', uomCode: selectedAgreement?.uomCode ?? 'BBL' });
    setLegDrawerOpen(true);
  }
  async function submitLeg(closeAfter = true) {
    const v = await legForm.validateFields();
    await addLeg.mutateAsync(v);
    if (closeAfter) { setLegDrawerOpen(false); } else {
      legForm.resetFields();
      legForm.setFieldsValue({ bolmoId: selectedBolmoId ?? 0, direction: 'BUY', uomCode: selectedAgreement?.uomCode ?? 'BBL' });
    }
  }

  // ── columns ──
  const colDefs = useMemo<ColDef<BolmoAgreement>[]>(() => [
    {
      field: 'bolmoReference', headerName: 'BKO Ref', width: 160, pinned: 'left', cellClass: 'cell-mono',
      cellRenderer: (p: { value: string; data: BolmoAgreement }) => (
        <span style={{ fontWeight: 600, cursor: 'pointer', color: selectedBolmoId === p.data?.bolmoId ? '#1677ff' : undefined }}>
          {p.value}
        </span>
      ),
    },
    { field: 'agreementDate', headerName: 'Date', width: 100, cellClass: 'cell-mono' },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1.2, minWidth: 150 },
    {
      field: 'commodityType', headerName: 'Commodity', width: 105,
      cellRenderer: (p: { value: string }) => (
        <Tag color={{ OIL: 'volcano', GAS: 'blue', POWER: 'gold', LNG: 'cyan', AGRICULTURAL: 'green', METALS: 'purple', FREIGHT: 'orange' }[p.value] ?? 'default'}
             style={{ fontSize: 10 }}>{p.value}</Tag>
      ),
    },
    { field: 'deliveryLocationCode', headerName: 'Location', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'deliveryPeriodCode', headerName: 'Period', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Net Qty / UoM', width: 140,
      valueGetter: (p) => `${Number(p.data?.netQuantity ?? 0).toLocaleString()} ${p.data?.uomCode ?? ''}`,
      cellStyle: { fontFamily: 'monospace', fontSize: 11 },
    },
    {
      headerName: 'Netting Price', width: 120, cellClass: 'cell-mono',
      valueGetter: (p) => p.data?.nettingPrice != null ? `${p.data.currencyCode} ${Number(p.data.nettingPrice).toFixed(4)}` : null,
      valueFormatter: (p) => p.value ?? '—',
    },
    {
      field: 'legCount', headerName: 'Legs', width: 65,
      cellRenderer: (p: { value: number }) => (
        <Tag color={p.value > 0 ? 'geekblue' : 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 110,
      cellRenderer: (p: { value: BolmoStatus }) => statusTag(p.value),
    },
    {
      headerName: '', width: 175, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: BolmoAgreement }) => {
        const s = p.data.status;
        return (
          <Space size={2}>
            <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
            {s === 'PENDING' && (
              <Tooltip title="Mark Agreed">
                <Popconfirm title="Mark as AGREED?" onConfirm={() => agree.mutate(p.data.bolmoId)} okText="Agree">
                  <Button type="text" size="small" icon={<CheckCircleOutlined />} style={{ color: '#1677ff' }} />
                </Popconfirm>
              </Tooltip>
            )}
            {s === 'AGREED' && (
              <Tooltip title="Mark Completed">
                <Popconfirm title="Mark as COMPLETED?" description="Confirm all legs have been cash-settled." onConfirm={() => complete.mutate(p.data.bolmoId)} okText="Complete">
                  <Button type="text" size="small" icon={<FileDoneOutlined />} style={{ color: '#22c55e' }} />
                </Popconfirm>
              </Tooltip>
            )}
            {(s === 'PENDING' || s === 'AGREED') && (
              <Tooltip title="Mark Disputed">
                <Popconfirm title="Mark as DISPUTED?" onConfirm={() => dispute.mutate(p.data.bolmoId)} okText="Dispute" okButtonProps={{ danger: true }}>
                  <Button type="text" size="small" icon={<WarningOutlined />} style={{ color: '#f59e0b' }} />
                </Popconfirm>
              </Tooltip>
            )}
            {s !== 'COMPLETED' && s !== 'CANCELLED' && (
              <Tooltip title="Cancel">
                <Popconfirm title="Cancel this BOLMO agreement?" onConfirm={() => cancel.mutate(p.data.bolmoId)} okText="Cancel" okButtonProps={{ danger: true }}>
                  <Button type="text" size="small" danger icon={<StopOutlined />} />
                </Popconfirm>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ], [agree, complete, dispute, cancel, selectedBolmoId]);

  const legColumns = [
    {
      title: 'B/S', dataIndex: 'direction', width: 55,
      render: (v: string) => <Tag color={DIRECTION_COLOR[v]} style={{ fontWeight: 700, fontSize: 10, margin: 0 }}>{v}</Tag>,
    },
    { title: 'Order Ref', dataIndex: 'orderReference', width: 175,
      render: (v: string | null) => v ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span> : <span style={{ color: '#9ca3af' }}>—</span>,
    },
    {
      title: 'Qty / UoM', width: 130,
      render: (_: unknown, r: { quantity: number; uomCode: string }) =>
        <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{Number(r.quantity).toLocaleString()} {r.uomCode}</span>,
    },
    {
      title: 'Price', dataIndex: 'price', width: 100,
      render: (v: number | null) => v != null
        ? <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{Number(v).toFixed(4)}</span>
        : <span style={{ color: '#9ca3af', fontSize: 11 }}>TBD</span>,
    },
    { title: 'Notes', dataIndex: 'notes', ellipsis: true,
      render: (v: string | null) => v ?? <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>,
    },
    {
      title: '', width: 60,
      render: (_: unknown, r: { legId: number }) => (
        <Popconfirm title="Remove this leg?" onConfirm={() => deleteLeg.mutate(r.legId)} okText="Remove" okButtonProps={{ danger: true }}>
          <Tooltip title="Remove"><Button type="text" size="small" danger icon={<DeleteOutlined />} /></Tooltip>
        </Popconfirm>
      ),
    },
  ];

  // ── cash settlement summary ──
  const cashSummary = useMemo(() => {
    if (!selectedAgreement?.nettingPrice || legs.length === 0) return null;
    const np = selectedAgreement.nettingPrice;
    let net = 0;
    for (const leg of legs) {
      if (leg.price == null) return null;
      const diff = leg.direction === 'BUY' ? (np - leg.price) : (leg.price - np);
      net += diff * leg.quantity;
    }
    return { net: Math.round(net * 100) / 100, ccy: selectedAgreement.currencyCode };
  }, [selectedAgreement, legs]);

  return (
    <>
      <PageHeader
        title="BOLMO Agreements"
        description="Book Out / Let Me Out — net offsetting physical delivery obligations with the same counterparty, eliminating logistics while cash-settling the price difference."
        moduleGroup="trade"
      />

      <SmartGrid
        columnDefs={colDefs}
        rowData={agreements}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New BOLMO"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.bolmoId)}
        onRowClicked={(e) => {
          const id = (e.data as BolmoAgreement).bolmoId;
          setSelectedBolmoId((prev) => (prev === id ? null : id));
        }}
        getRowStyle={(p) => (p.data as BolmoAgreement).bolmoId === selectedBolmoId ? { background: 'rgba(22,119,255,0.06)' } : undefined}
      />

      {/* ── Legs sub-panel ── */}
      <Card
        size="small"
        style={{ marginTop: 16, border: selectedAgreement ? '1px solid rgba(22,119,255,0.25)' : undefined }}
        styles={{ body: { padding: '8px 12px 12px' } }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {selectedAgreement ? (
              <Space size={6}>
                <Text strong style={{ fontSize: 13 }}>Booked-Out Legs</Text>
                <Text style={{ fontSize: 12, color: '#1677ff', fontWeight: 600 }}>{selectedAgreement.bolmoReference}</Text>
                <Badge count={legs.length} showZero style={{ backgroundColor: legs.length ? '#1677ff' : '#d9d9d9' }} />
                {statusTag(selectedAgreement.status)}
                {cashSummary !== null && (
                  <Tag color={cashSummary.net >= 0 ? 'success' : 'error'} style={{ fontSize: 11 }}>
                    Net cash: {cashSummary.ccy} {Math.abs(cashSummary.net).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    {cashSummary.net >= 0 ? ' receivable' : ' payable'}
                  </Tag>
                )}
              </Space>
            ) : (
              <Text type="secondary" style={{ fontSize: 12 }}>Legs — click an agreement row above to view its booked-out legs</Text>
            )}
            {selectedAgreement && selectedAgreement.status !== 'COMPLETED' && selectedAgreement.status !== 'CANCELLED' && (
              <Button size="small" type="primary" ghost icon={<PlusOutlined />} onClick={openAddLeg}>
                Add Leg
              </Button>
            )}
          </div>
        }
      >
        {selectedAgreement ? (
          legs.length === 0
            ? <Alert type="info" style={{ fontSize: 12 }} message="No legs yet — add the opposing trade legs (BUY + SELL) that are being booked out." />
            : <Table columns={legColumns} dataSource={legs} rowKey="legId" size="small" pagination={false} style={{ fontSize: 12 }} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Select an agreement to view its legs" style={{ margin: '20px 0' }} />
        )}
      </Card>

      {/* ══ AGREEMENT DRAWER ══════════════════════════════════════════════════════ */}
      <Drawer
        title={editing ? `Edit BOLMO — ${editing.bolmoReference}` : 'New BOLMO Agreement'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={600}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submitAgreement(false); }} loading={saveAgreement.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submitAgreement(true); }} loading={saveAgreement.isPending}>
              {editing ? 'Update' : 'Create BOLMO'}
            </Button>
          </Space>
        }
      >
        <Form form={agForm} layout="vertical" size="small">
          <Divider orientation="left" style={{ margin: '0 0 8px', fontSize: 11 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Parties</Text>
          </Divider>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}>
                <Select
                  showSearch allowClear
                  filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
                  options={(counterparties as unknown as { counterpartyId: number; counterpartyCode: string; counterpartyName: string }[])
                    .map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.counterpartyName}` }))}
                  placeholder="Select counterparty"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="legalEntityId" label="Our Legal Entity" rules={[{ required: true }]}>
                <Select
                  showSearch allowClear
                  options={(legalEntities as unknown as { legalEntityId: number; entityCode: string; entityName: string }[])
                    .map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` }))}
                  placeholder="Select legal entity"
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '8px 0', fontSize: 11 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Delivery</Text>
          </Divider>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="agreementDate" label="Agreement Date" rules={[{ required: true }]}>
                <Input placeholder="2026-07-01" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="settlementDate" label={hint('Settlement Date', 'Date cash settlement amount is due.')}>
                <Input placeholder="2026-07-15" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="commodityType" label="Commodity" rules={[{ required: true }]}>
                <Select options={COMMODITY_TYPES_TRADE.map((c) => ({ value: c, label: c }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="deliveryLocationCode" label={hint('Delivery Location', 'Pipeline hub, terminal, or storage point where obligations would have been delivered.')}>
                <Input placeholder="SULLOM-VOE" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="deliveryPeriodCode" label={hint('Delivery Period', 'Period the obligations fall in — M2026-07, Q2026-Q3, SPOT.')}>
                <Input placeholder="M2026-07" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '8px 0', fontSize: 11 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quantity & Price</Text>
          </Divider>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="netQuantity" label={hint('Net Quantity', 'Quantity being booked out — the volume on which cash settlement is calculated.')} rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="250000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="uomCode" label="UoM" rules={[{ required: true }]}>
                <Input placeholder="BBL" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="nettingPrice" label={hint('Netting Price', 'Agreed cash settlement reference price. Cash flow per leg = (nettingPrice − legPrice) × qty for BUY legs; reverse for SELL.')}>
                <InputNumber style={{ width: '100%' }} precision={4} placeholder="82.00" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="currencyCode" label="CCY" rules={[{ required: true }]}>
                <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left" style={{ margin: '8px 0', fontSize: 11 }}>
            <Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Status & Notes</Text>
          </Divider>
          <Row gutter={12}>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select options={BOLMO_STATUSES.map((s) => ({ value: s, label: s }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional context, legal references, dispute details..." />
          </Form.Item>
        </Form>
      </Drawer>

      {/* ══ LEG DRAWER ══════════════════════════════════════════════════════════ */}
      <Drawer
        title={`Add Leg — ${selectedAgreement?.bolmoReference ?? ''}`}
        open={legDrawerOpen}
        onClose={() => setLegDrawerOpen(false)}
        width={420}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setLegDrawerOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submitLeg(false); }} loading={addLeg.isPending}>Add & Next</Button>
            <Button type="primary" onClick={() => { void submitLeg(true); }} loading={addLeg.isPending}>Add & Close</Button>
          </Space>
        }
      >
        <Form form={legForm} layout="vertical" size="small">
          <Form.Item name="bolmoId" hidden><Input /></Form.Item>
          <Form.Item name="direction" label="Direction" rules={[{ required: true }]}>
            <Select options={BOLMO_DIRECTIONS.map((d) => ({ value: d, label: d }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={14}>
              <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} placeholder="250000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="uomCode" label="UoM" rules={[{ required: true }]}>
                <Input placeholder="BBL" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="price" label={hint('Leg Price', 'Original trade price on this leg. Used to compute cash settlement vs the netting price.')}>
            <InputNumber style={{ width: '100%' }} precision={4} placeholder="81.50" />
          </Form.Item>
          <Form.Item name="orderId" label={hint('Linked Order ID', 'Optional: link to the original trade order being booked out.')}>
            <InputNumber style={{ width: '100%' }} placeholder="Order ID (optional)" precision={0} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="E.g. TRD-2026-00001-01 Forties cargo BUY" />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
