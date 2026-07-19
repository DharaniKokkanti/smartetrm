import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, InputNumber, Select, Tooltip } from 'antd';
import { EditOutlined, WarningOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useTableRows } from '@features/tier2/hooks';
import { useLegalEntities } from '@features/trade/hooks';
import { useEmissionSchemes } from '@features/environmental/emission-schemes/hooks';
import { useEmissionObligations, useSaveEmissionObligation } from './hooks';
import type { EmissionObligation, EmissionObligationInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { AuditInfo } from '@components/smart/AuditInfo';
import dayjs, { type Dayjs } from 'dayjs';

const STATUS_COLOR: Record<string, string> = {
  OPEN: 'processing', SURRENDERED: 'success', PARTIALLY_SURRENDERED: 'warning', OVERDUE: 'error',
};

export function EmissionObligationsPage() {
  const { data = [], isLoading, refetch } = useEmissionObligations();
  const save = useSaveEmissionObligation();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: schemes = [] }       = useEmissionSchemes();
  const { data: statusRows = [] }    = useTableRows<{ typeCode: string; typeName: string }>('emission_obligation_status');
  const statusOpts = statusRows.map((r) => ({ value: r.typeCode, label: r.typeName }));

  const leOpts = useMemo(
    () => legalEntities.map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );
  const schemeOpts = useMemo(
    () => (schemes as { schemeId: number; schemeCode: string; schemeName: string }[])
      .map((s) => ({ value: s.schemeId, label: `${s.schemeCode} — ${s.schemeName}` })),
    [schemes],
  );

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<EmissionObligation | null>(null);
  const [form]                = Form.useForm<EmissionObligationInput>();
  useFormDraft('env-obligations', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ obligationYear: new Date().getFullYear(), status: 'OPEN' });
    setOpen(true);
  }
  function openEdit(r: EmissionObligation) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      verifiedEmissions: r.verifiedEmissions ?? undefined,
      allowancesHeld: r.allowancesHeld ?? undefined,
      surrenderDeadline: r.surrenderDeadline ? dayjs(r.surrenderDeadline) : undefined,
      notes: r.notes ?? undefined,
    } as unknown as EmissionObligationInput);
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: EmissionObligationInput = {
      ...values,
      surrenderDeadline: v.surrenderDeadline ? v.surrenderDeadline.format('YYYY-MM-DD') : null,
      rowVersion: editing?.rowVersion ?? 0,
    };
    const saved = await save.mutateAsync({ id: editing?.obligationId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<EmissionObligation>[]>(() => [
    { field: 'entityName',          headerName: 'Legal Entity',   flex: 1, minWidth: 160, pinned: 'left' },
    { field: 'schemeName',          headerName: 'Scheme',         flex: 1, minWidth: 160 },
    { field: 'obligationYear',      headerName: 'Year',           width: 80, cellClass: 'cell-mono' },
    { field: 'verifiedEmissions',   headerName: 'Verified (tCO2e)', width: 145, type: 'numericColumn', valueFormatter: (p) => p.value != null ? p.value.toLocaleString() : '—' },
    { field: 'allowancesHeld',      headerName: 'Held (tCO2e)',   width: 125, type: 'numericColumn', valueFormatter: (p) => p.value != null ? p.value.toLocaleString() : '—' },
    { field: 'shortfallUnits',      headerName: 'Shortfall',      width: 120, type: 'numericColumn',
      cellRenderer: (p: { value: number | null }) => {
        if (p.value == null) return '—';
        const color = p.value > 0 ? '#ef4444' : '#22c55e';
        return <span style={{ color, fontFamily: 'monospace', fontWeight: 600 }}>{p.value > 0 ? `+${p.value.toLocaleString()}` : p.value.toLocaleString()}</span>;
      } },
    { field: 'surrenderDeadline',   headerName: 'Deadline',       width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'status', headerName: 'Status', width: 170,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    { headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: EmissionObligation }) => (
        <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
      ) },
  ], []);

  const overdue = data.filter((d) => d.status === 'OVERDUE').length;

  return (
    <>
      <PageHeader
        title="Emission Obligations"
        description="Surrender obligations per legal entity per scheme year. Tracks verified emissions, allowances held, shortfall, and surrender deadline for REMIT, EU ETS, UK ETS and voluntary markets."
        moduleGroup="environmental"
        extra={overdue > 0 ? <Tag icon={<WarningOutlined />} color="error">{overdue} OVERDUE</Tag> : undefined}
      />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Obligation" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.obligationId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit Obligation — ${editing.entityName} ${editing.obligationYear}` : 'New Emission Obligation'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" placeholder="Select entity" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="schemeId" label="Scheme" rules={[{ required: true }]} style={{ flex: 2 }}>
              <Select options={schemeOpts} showSearch optionFilterProp="label" placeholder="Select scheme" />
            </Form.Item>
            <Form.Item name="obligationYear" label="Year" rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="2025" min={2000} max={2100} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="verifiedEmissions" label={hint('Verified Emissions', 'tCO2e verified by an accredited verifier for the obligation year.')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="125000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
            </Form.Item>
            <Form.Item name="allowancesHeld" label={hint('Allowances Held', 'tCO2e allowances held in the registry account at time of surrender.')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="120000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="surrenderDeadline" label="Surrender Deadline" style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={statusOpts} />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Verifier name, submission reference, any outstanding issues..." />
          </Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
