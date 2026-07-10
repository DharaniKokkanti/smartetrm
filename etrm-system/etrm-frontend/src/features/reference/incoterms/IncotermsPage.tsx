import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useIncotermsRef, useSaveIncoterm, useDeactivateIncoterm } from './hooks';
import { INCOTERM_VERSIONS, TRANSPORT_MODES, type Incoterm, type IncotermInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const TRANSPORT_COLOR: Record<string, string> = { ANY: 'blue', SEA_INLAND: 'cyan', ANY_EXCEPT_SEA: 'orange' };

export function IncotermsPage() {
  const { data, isLoading, refetch } = useIncotermsRef();
  const save = useSaveIncoterm();
  const deactivate = useDeactivateIncoterm();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Incoterm | null>(null);
  const [form] = Form.useForm<IncotermInput>();
  useFormDraft('ref-incoterms', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ version: 'INCOTERMS_2020', isActive: true }); setOpen(true); }
  function openEdit(r: Incoterm) { setEditing(r); form.setFieldsValue({ ...r }); setOpen(true); }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.incotermId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Incoterm>[]>(() => [
    { field: 'incotermCode', headerName: 'Code', width: 90, pinned: 'left', cellRenderer: (p: { value: string }) => <Tag color="blue" style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{p.value}</Tag> },
    { field: 'incotermName', headerName: 'Name', flex: 1.2, minWidth: 200 },
    { field: 'version', headerName: 'Version', width: 140, cellClass: 'cell-mono', valueFormatter: (p) => (p.value as string).replace('INCOTERMS_', 'Incoterms ') },
    { field: 'transportMode', headerName: 'Transport', width: 140, cellRenderer: (p: { value: string }) => <Tag color={TRANSPORT_COLOR[p.value] ?? 'default'}>{p.value.replace('_', ' ')}</Tag> },
    { field: 'riskTransferPoint', headerName: 'Risk Transfers At', flex: 1.5, minWidth: 220 },
    { field: 'isActive', headerName: 'Status', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Incoterm }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate?" onConfirm={() => deactivate.mutate(p.data.incotermId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )},
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Incoterms" description="Incoterms 2020 delivery terms — define risk transfer, cost responsibility, and title transfer points for all physical trades." moduleGroup="reference" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Incoterm" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.incotermId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit ${editing.incotermCode}` : 'New Incoterm'} open={open} onClose={() => setOpen(false)} width={560}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="incotermCode" label={hint('Incoterm Code', 'Standard 3-letter ICC code — FOB, CIF, DAP, EXW etc. Must match ICC Incoterms 2020 publication exactly.', 'FOB')} rules={[{ required: true, max: 3 }]}>
            <Input placeholder="FOB" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 700 }} />
          </Form.Item>
          <Form.Item name="incotermName" label="Full Name" rules={[{ required: true }]}><Input placeholder="Free On Board" /></Form.Item>
          <Form.Item name="version" label="Version" rules={[{ required: true }]}>
            <Select options={INCOTERM_VERSIONS.map((v) => ({ value: v, label: v.replace('INCOTERMS_', 'Incoterms ') }))} />
          </Form.Item>
          <Form.Item name="transportMode" label={hint('Transport Mode', 'ANY = applies to all transport. SEA_INLAND = sea/inland waterway only (FOB, CIF, CFR, FAS). ANY_EXCEPT_SEA = land/air/multimodal.')}>
            <Select options={TRANSPORT_MODES.map((m) => ({ value: m, label: m.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="riskTransferPoint" label={hint('Risk Transfer Point', 'The precise moment ownership of loss/damage risk moves from seller to buyer. Critical for cargo insurance placement.')} rules={[{ required: true }]}>
            <Input placeholder="On board vessel at named load port" />
          </Form.Item>
          <Form.Item name="costResponsibility" label={hint('Cost Responsibility', 'Where the seller\'s payment obligation ends — can differ from Risk Transfer Point above (e.g. CIF: seller pays freight/insurance to destination but risk passes at load port).')} rules={[{ required: true }]}>
            <Input.TextArea rows={2} placeholder="Seller pays freight; buyer insures from load port" />
          </Form.Item>
          <Form.Item name="titleTransfer" label="Title Transfer Point">
            <Input placeholder="Ship's rail at load port" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
