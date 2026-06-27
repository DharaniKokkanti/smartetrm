import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useUom, useSaveUom, useDeactivateUom } from './hooks';
import { UOM_TYPES, type Uom, type UomInput } from './types';

const TYPE_COLOR: Record<string, string> = { VOLUME: 'blue', WEIGHT: 'orange', ENERGY: 'volcano', POWER: 'gold', QUANTITY: 'cyan', DISTANCE: 'green' };

export function UomPage() {
  const { data, isLoading, refetch } = useUom();
  const save = useSaveUom();
  const deactivate = useDeactivateUom();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Uom | null>(null);
  const [form] = Form.useForm<UomInput>();

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(r: Uom) { setEditing(r); form.setFieldsValue({ ...r }); setOpen(true); }
  async function submit() { const v = await form.validateFields(); await save.mutateAsync({ id: editing?.uomId ?? null, input: v }); setOpen(false); }

  const colDefs = useMemo<ColDef<Uom>[]>(() => [
    { field: 'uomCode', headerName: 'Code', width: 100, pinned: 'left', cellClass: 'cell-mono', cellRenderer: (p: { value: string }) => <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>{p.value}</Tag> },
    { field: 'uomName', headerName: 'Unit Name', flex: 1.5, minWidth: 200 },
    { field: 'uomType', headerName: 'Type', width: 100, cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value}</Tag> },
    { field: 'baseUomCode', headerName: 'Base Unit', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'conversionFactor', headerName: 'Conversion Factor', width: 150, type: 'numericColumn', valueFormatter: (p) => p.value != null ? Number(p.value).toFixed(6) : '—' },
    { field: 'commodityHint', headerName: 'Used For', flex: 1.2, minWidth: 180, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Uom }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate?" onConfirm={() => deactivate.mutate(p.data.uomId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )},
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Units of Measure" description="Standardised quantity and volume units used across all trade capture, pricing, and position records." moduleGroup="reference" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New UoM" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.uomId)} />
      <Drawer title={editing ? `Edit UoM — ${editing.uomCode}` : 'New Unit of Measure'} open={open} onClose={() => setOpen(false)} width={480}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="primary" onClick={submit} loading={save.isPending}>Save</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="uomCode" label={hint('UoM Code', 'Short identifier used everywhere in system — BBL, MT, MWH, MMBTU, THERM. Cannot change once used in trades.', 'BBL')} rules={[{ required: true }]}>
            <Input placeholder="BBL" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="uomName" label="Full Name" rules={[{ required: true }]}>
            <Input placeholder="Barrel (42 US Gallons)" />
          </Form.Item>
          <Form.Item name="uomType" label="Type" rules={[{ required: true }]}>
            <Select options={UOM_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="baseUomCode" label={hint('Base Unit Code', 'The reference unit within this type — all conversion factors are relative to this. e.g. base VOLUME = BBL, base WEIGHT = MT.')}>
            <Input placeholder="BBL" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="conversionFactor" label={hint('Conversion Factor', 'Multiply this unit × factor to get base unit. 1 MT crude ≈ 7.33 BBL (API°-dependent). 1 MMBTU = 0.29307 MWH.')}>
            <InputNumber precision={6} style={{ width: '100%' }} placeholder="1.000000" />
          </Form.Item>
          <Form.Item name="commodityHint" label="Used For (hint)">
            <Input placeholder="Crude oil, refined products (Americas)" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
