import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Tooltip } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTableRows } from '@features/tier2/hooks';
import { useCarbonRegistries, useSaveCarbonRegistry, useDeactivateCarbonRegistry } from './hooks';
import type { CarbonRegistry, CarbonRegistryInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const TYPE_COLOR: Record<string, string> = { COMPLIANCE: 'blue', VOLUNTARY: 'green' };

export function CarbonRegistriesPage() {
  const { data = [], isLoading, refetch } = useCarbonRegistries();
  const save       = useSaveCarbonRegistry();
  const deactivate = useDeactivateCarbonRegistry();
  const { data: registryTypeRows = [] } = useTableRows('carbon_registry_type');
  type LR = { typeCode: string; typeName: string };
  const registryTypeOpts = (registryTypeRows as LR[]).map((r) => ({ value: r.typeCode, label: r.typeName }));

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<CarbonRegistry | null>(null);
  const [form]                = Form.useForm<CarbonRegistryInput>();
  useFormDraft('env-registries', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ registryType: 'COMPLIANCE', isActive: true });
    setOpen(true);
  }
  function openEdit(r: CarbonRegistry) {
    setEditing(r);
    form.setFieldsValue({ ...r, operator: r.operator ?? undefined, website: r.website ?? undefined });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.registryId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<CarbonRegistry>[]>(() => [
    { field: 'registryCode', headerName: 'Code',     width: 130, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'registryName', headerName: 'Registry', flex: 1, minWidth: 200 },
    { field: 'registryType', headerName: 'Type',     width: 115,
      cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'operator', headerName: 'Operator', flex: 1, minWidth: 150, valueFormatter: (p) => p.value ?? '—' },
    { field: 'website',  headerName: 'Website',  flex: 1, minWidth: 180, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 80, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: CarbonRegistry }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.isActive && (
            <Popconfirm title="Deactivate this registry?" onConfirm={() => deactivate.mutate(p.data.registryId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ) },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Carbon Registries" description="Registries where environmental instruments are issued, held, and cancelled — EU Union Registry, UK Registry, Verra, Gold Standard, American Carbon Registry." moduleGroup="environmental" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Registry" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.registryId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit — ${editing.registryName}` : 'New Carbon Registry'} open={open} onClose={() => setOpen(false)} width={500}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="registryCode" label={hint('Registry Code', 'Short identifier — EU_UNION, UK_REG, VERRA, GOLD_STD, ACR, APX.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="EU_UNION" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="registryType" label="Type" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={registryTypeOpts} />
            </Form.Item>
          </Space>
          <Form.Item name="registryName" label="Registry Name" rules={[{ required: true }]}>
            <Input placeholder="EU Union Registry" />
          </Form.Item>
          <Form.Item name="operator" label={hint('Operator', 'Organisation that runs the registry — European Commission, Environment Agency, Verra, Gold Standard Foundation.')}>
            <Input placeholder="European Commission / SRD" />
          </Form.Item>
          <Form.Item name="website" label="Website">
            <Input placeholder="registry.ets.europa.eu" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
