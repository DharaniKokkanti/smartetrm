import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, InputNumber, Select, Tooltip, Progress, Statistic, Row, Col, Card } from 'antd';
import { EditOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useLegalEntities } from '@features/trade/hooks';
import { useRinFuelCategories } from '@features/rins/fuel-categories/hooks';
import { useRinObligations, useSaveRinObligation } from './hooks';
import type { RinObligation, RinObligationInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs, { type Dayjs } from 'dayjs';

const D_CODE_COLOR: Record<string, string> = { D3: 'purple', D4: 'blue', D5: 'green', D6: 'orange', D7: 'cyan' };
const STATUS_COLOR: Record<string, string> = {
  OPEN: 'processing', PARTIALLY_SATISFIED: 'warning', SATISFIED: 'success', OVERDUE: 'error',
};
const STATUS_OPTS = [
  { value: 'OPEN',                label: 'Open' },
  { value: 'PARTIALLY_SATISFIED', label: 'Partially Satisfied' },
  { value: 'SATISFIED',           label: 'Satisfied' },
  { value: 'OVERDUE',             label: 'Overdue' },
];

export function RinObligationsPage() {
  const { data = [], isLoading, refetch } = useRinObligations();
  const save = useSaveRinObligation();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: fuelCats = [] }      = useRinFuelCategories();

  const leOpts = useMemo(
    () => legalEntities.map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );
  const dCodeOpts = useMemo(
    () => (fuelCats as { categoryId: number; dCode: string; fuelName: string }[])
      .map((c) => ({ value: c.dCode, label: `${c.dCode} — ${c.fuelName}` })),
    [fuelCats],
  );

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<RinObligation | null>(null);
  const [form]                = Form.useForm<RinObligationInput>();
  useFormDraft('rins-obligations', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ complianceYear: new Date().getFullYear(), status: 'OPEN', retiredQuantity: 0 });
    setOpen(true);
  }
  function openEdit(r: RinObligation) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      deadline: r.deadline ? dayjs(r.deadline) : undefined,
      notes: r.notes ?? undefined,
    } as unknown as RinObligationInput);
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const deadline = (v as unknown as Record<string, Dayjs | undefined>).deadline;
    const saved = await save.mutateAsync({
      id: editing?.obligationId ?? null,
      input: { ...v, deadline: deadline ? deadline.format('YYYY-MM-DD') : null, notes: v.notes ?? null },
    });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const totalRequired = data.reduce((s, r) => s + r.requiredQuantity, 0);
  const totalRetired  = data.reduce((s, r) => s + r.retiredQuantity, 0);
  const openObligations = data.filter((r) => r.status === 'OPEN' || r.status === 'PARTIALLY_SATISFIED');
  const overdue = data.filter((r) => r.status === 'OVERDUE');

  const colDefs = useMemo<ColDef<RinObligation>[]>(() => [
    { field: 'entityName',      headerName: 'Legal Entity',    flex: 1,   minWidth: 160, pinned: 'left' },
    { field: 'complianceYear',  headerName: 'Year',            width: 80,  cellClass: 'cell-mono' },
    { field: 'dCode', headerName: 'D-Code', width: 85,
      cellRenderer: (p: { value: string }) => <Tag color={D_CODE_COLOR[p.value] ?? 'default'} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 11 }}>{p.value}</Tag> },
    { field: 'requiredQuantity', headerName: 'Required (RINs)', width: 155, type: 'numericColumn',
      valueFormatter: (p) => Number(p.value).toLocaleString() },
    { field: 'retiredQuantity',  headerName: 'Retired (RINs)',  width: 145, type: 'numericColumn',
      valueFormatter: (p) => Number(p.value).toLocaleString() },
    { field: 'shortfallQuantity', headerName: 'Shortfall',      width: 130, type: 'numericColumn',
      cellRenderer: (p: { value: number }) => {
        const color = p.value > 0 ? '#ef4444' : '#22c55e';
        const text = p.value > 0 ? `−${p.value.toLocaleString()}` : `+${Math.abs(p.value).toLocaleString()} surplus`;
        return <span style={{ fontFamily: 'monospace', fontWeight: 600, color }}>{text}</span>;
      } },
    { headerName: 'Completion', width: 160, sortable: false, filter: false,
      cellRenderer: (p: { data: RinObligation }) => {
        const pct = p.data.requiredQuantity > 0
          ? Math.min(100, Math.round((p.data.retiredQuantity / p.data.requiredQuantity) * 100))
          : 0;
        const status = p.data.status === 'SATISFIED' ? 'success' : p.data.status === 'OVERDUE' ? 'exception' : 'active';
        return <Progress percent={pct} size="small" status={status} style={{ margin: 0 }} />;
      } },
    { field: 'deadline', headerName: 'Deadline', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'status', headerName: 'Status', width: 170,
      cellRenderer: (p: { value: string }) => (
        <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>
          {STATUS_OPTS.find((s) => s.value === p.value)?.label ?? p.value}
        </Tag>
      ) },
    { headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: RinObligation }) => (
        <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
      ) },
  ], []);

  return (
    <>
      <PageHeader
        title="RVO Obligations"
        description="Renewable Volume Obligations (RVOs) per legal entity, D-code, and compliance year. The EPA calculates each obligated party's RVO based on gasoline and diesel volume introduced into commerce. RINs are retired via EPA EMTS to satisfy these obligations by the annual deadline."
        moduleGroup="rins"
        extra={overdue.length > 0 ? <Tag icon={<WarningOutlined />} color="error">{overdue.length} OVERDUE</Tag> : undefined}
      />
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Total RVO Required" value={totalRequired} formatter={(v) => Number(v).toLocaleString()} suffix="RINs" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic title="Total RINs Retired" value={totalRetired} formatter={(v) => Number(v).toLocaleString()} suffix="RINs" valueStyle={{ color: '#22c55e' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Open Obligations"
              value={openObligations.length}
              suffix={`/ ${data.length}`}
              valueStyle={{ color: openObligations.length > 0 ? '#f59e0b' : '#22c55e' }}
            />
          </Card>
        </Col>
      </Row>
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Obligation" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.obligationId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit — ${editing.entityName} ${editing.dCode} ${editing.complianceYear}` : 'New RVO Obligation'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" placeholder="Select obligated party" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="dCode" label={hint('D-Code', 'EPA RFS category: D3=cellulosic biofuel, D4=biomass-based diesel, D5=advanced biofuel, D6=renewable fuel (ethanol), D7=cellulosic diesel.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={dCodeOpts} />
            </Form.Item>
            <Form.Item name="complianceYear" label={hint('Compliance Year', 'Calendar year for which this RVO applies. Deadline is typically March 31 of the following year.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} min={2010} max={2050} placeholder="2025" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="requiredQuantity" label={hint('Required RINs (RVO)', 'Total RINs required to satisfy this D-code obligation for the compliance year, as calculated from volume introduced into commerce.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber<number> style={{ width: '100%' }} min={0} placeholder="5000000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
            </Form.Item>
            <Form.Item name="retiredQuantity" label={hint('Retired RINs', 'Cumulative RINs retired to EPA EMTS so far. Updated automatically when RETIRE transactions are confirmed.')} style={{ flex: 1 }}>
              <InputNumber<number> style={{ width: '100%' }} min={0} placeholder="0" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="deadline" label={hint('Deadline', 'Annual RVO submission deadline — typically March 31 of the year following the compliance year.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={STATUS_OPTS} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="EPA calculation reference, volume data source, any adjustments or carry-forward notes..." />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
