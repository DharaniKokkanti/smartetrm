import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AuditInfo } from '@components/smart/AuditInfo';
import { useVessels } from '@features/logistics/vessels/hooks';
import { useVesselCargoTanks, useSaveVesselCargoTank } from './hooks';
import { TANK_TYPES, type VesselCargoTank, type VesselCargoTankInput } from './types';

export function VesselCargoTanksPage() {
  const { data = [], isLoading, refetch } = useVesselCargoTanks();
  const save = useSaveVesselCargoTank();
  const { data: vessels = [] } = useVessels();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<VesselCargoTank | null>(null);
  const [form] = Form.useForm<VesselCargoTankInput>();

  const vesselOptions = vessels.map((v) => ({ value: v.vesselId, label: v.vesselName }));

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('tankType', 'CARGO_TANK');
    form.setFieldValue('isActive', true);
    setOpen(true);
  }

  function openEdit(r: VesselCargoTank) {
    setEditing(r);
    form.setFieldsValue({
      vesselId: r.vesselId, tankCode: r.tankCode, tankType: r.tankType, capacityCbm: r.capacityCbm,
      coatingType: r.coatingType ?? undefined, segregationGroup: r.segregationGroup ?? undefined,
      notes: r.notes ?? undefined, isActive: r.isActive,
    });
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    await save.mutateAsync({ id: editing?.tankId ?? null, input: v });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<VesselCargoTank>[]>(() => [
    { field: 'vesselName', headerName: 'Vessel', flex: 1, minWidth: 160, pinned: 'left' },
    { field: 'tankCode', headerName: 'Tank/Hold Code', width: 130, cellClass: 'cell-mono' },
    { field: 'tankType', headerName: 'Type', width: 130, cellRenderer: (p: { value: string }) => <Tag color={p.value === 'CARGO_TANK' ? 'blue' : 'brown'}>{p.value.replace('_', ' ')}</Tag> },
    { field: 'capacityCbm', headerName: 'Capacity (CBM)', width: 140, cellClass: 'cell-mono', valueFormatter: (p) => Number(p.value).toLocaleString() },
    { field: 'coatingType', headerName: 'Coating', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'segregationGroup', headerName: 'Segregation Group', width: 150, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: VesselCargoTank }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Vessel Cargo Tank / Hold Configuration"
        description="Per-tank (liquid bulk) or per-hold (dry bulk) structure on a vessel — capacity, coating, and segregation group. One table covers both cargo forms via Type, kept commodity-agnostic."
        moduleGroup="Logistics & Delivery"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Tank / Hold"
        onRefresh={() => void refetch()}
        getRowId={(p) => String(p.data.tankId)}
      />
      <Drawer title={editing ? 'Edit Tank / Hold' : 'New Tank / Hold'} open={open} onClose={() => setOpen(false)} width={440}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="primary" onClick={() => void submit()} loading={save.isPending}>Save</Button>
        </Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="vesselId" label="Vessel" rules={[{ required: true }]}><Select options={vesselOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="tankCode" label="Tank/Hold Code" rules={[{ required: true }]}><Input placeholder="e.g. 1P, COT-1, Hold 3" /></Form.Item>
          <Form.Item name="tankType" label="Type" rules={[{ required: true }]}>
            <Select options={TANK_TYPES.map((t) => ({ value: t, label: t.replace('_', ' ') }))} />
          </Form.Item>
          <Form.Item name="capacityCbm" label="Capacity (CBM)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="coatingType" label="Coating Type"><Input placeholder="e.g. EPOXY, ZINC, STAINLESS" /></Form.Item>
          <Form.Item name="segregationGroup" label="Segregation Group"><Input /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="isActive" hidden initialValue={true}><Input /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} createdBy={editing?.createdBy} updatedAt={editing?.updatedAt} updatedBy={editing?.updatedBy} />
      </Drawer>
    </>
  );
}
