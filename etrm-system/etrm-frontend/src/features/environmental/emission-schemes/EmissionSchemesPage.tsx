import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Tooltip } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTableRows } from '@features/tier2/hooks';
import { useEmissionSchemes, useSaveEmissionScheme, useDeactivateEmissionScheme } from './hooks';
import type { EmissionScheme, EmissionSchemeInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const TYPE_COLOR: Record<string, string> = { COMPLIANCE: 'blue', VOLUNTARY: 'green' };

export function EmissionSchemesPage() {
  const { data = [], isLoading, refetch } = useEmissionSchemes();
  const save       = useSaveEmissionScheme();
  const deactivate = useDeactivateEmissionScheme();
  const { data: schemeTypeRows = [] } = useTableRows('emission_scheme_type');
  type LR = { typeCode: string; typeName: string };
  const schemeTypeOpts = (schemeTypeRows as LR[]).map((r) => ({ value: r.typeCode, label: r.typeName }));

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<EmissionScheme | null>(null);
  const [form]                = Form.useForm<EmissionSchemeInput>();
  useFormDraft('env-schemes', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ schemeType: 'COMPLIANCE', isActive: true });
    setOpen(true);
  }
  function openEdit(r: EmissionScheme) {
    setEditing(r);
    form.setFieldsValue({ ...r, regulator: r.regulator ?? undefined, jurisdiction: r.jurisdiction ?? undefined, description: r.description ?? undefined });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.schemeId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<EmissionScheme>[]>(() => [
    { field: 'schemeCode',  headerName: 'Code',        width: 120, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'schemeName',  headerName: 'Scheme Name', flex: 1, minWidth: 200 },
    { field: 'schemeType',  headerName: 'Type',        width: 120,
      cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'regulator',   headerName: 'Regulator',   flex: 1, minWidth: 150, valueFormatter: (p) => p.value ?? '—' },
    { field: 'jurisdiction',headerName: 'Jurisdiction',flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 80, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: EmissionScheme }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.isActive && (
            <Popconfirm title="Deactivate this scheme?" onConfirm={() => deactivate.mutate(p.data.schemeId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ) },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Emission Schemes" description="Cap-and-trade and voluntary carbon schemes — EU ETS, UK ETS, California Cap-and-Trade, RGGI, VCS, Gold Standard. Parent reference for environmental products and surrender obligations." moduleGroup="environmental" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Scheme" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.schemeId)} />
      <Drawer title={editing ? `Edit — ${editing.schemeName}` : 'New Emission Scheme'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="schemeCode" label={hint('Scheme Code', 'Short system identifier — EU_ETS, UK_ETS, CA_CAP, RGGI, VCS, GS.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="EU_ETS" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="schemeType" label="Type" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={schemeTypeOpts} />
            </Form.Item>
          </Space>
          <Form.Item name="schemeName" label="Scheme Name" rules={[{ required: true }]}>
            <Input placeholder="EU Emissions Trading System" />
          </Form.Item>
          <Form.Item name="regulator" label={hint('Regulator', 'Authority administering the scheme — European Commission, UK DESNZ, CARB, EPA.')}>
            <Input placeholder="European Commission" />
          </Form.Item>
          <Form.Item name="jurisdiction" label={hint('Jurisdiction', 'Geographic scope — European Union, United Kingdom, California, US Northeast.')}>
            <Input placeholder="European Union" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Brief description of the scheme's scope, participants, and compliance cycle." />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
