import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber, Select, Switch, Tooltip, Statistic, Row, Col, Card } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useRinFuelCategories, useSaveRinFuelCategory, useDeactivateRinFuelCategory } from './hooks';
import type { RinFuelCategory, RinFuelCategoryInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const D_CODE_COLOR: Record<string, string> = {
  D3: 'purple', D4: 'blue', D5: 'green', D6: 'orange', D7: 'cyan',
};
const FUEL_TYPE_OPTS = [
  { value: 'CELLULOSIC',       label: 'Cellulosic Biofuel' },
  { value: 'BIOMASS_DIESEL',   label: 'Biomass-Based Diesel' },
  { value: 'ADVANCED',         label: 'Advanced Biofuel' },
  { value: 'CONVENTIONAL',     label: 'Conventional Biofuel' },
  { value: 'CELLULOSIC_DIESEL',label: 'Cellulosic Diesel' },
];

export function FuelCategoriesPage() {
  const { data = [], isLoading, refetch } = useRinFuelCategories();
  const save       = useSaveRinFuelCategory();
  const deactivate = useDeactivateRinFuelCategory();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<RinFuelCategory | null>(null);
  const [form]                = Form.useForm<RinFuelCategoryInput>();
  useFormDraft('rins-fuel-categories', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ equivalenceValue: 1.0, isActive: true });
    setOpen(true);
  }
  function openEdit(r: RinFuelCategory) {
    setEditing(r);
    form.setFieldsValue({ ...r, energySources: r.energySources ?? undefined, description: r.description ?? undefined });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.categoryId ?? null, input: { ...v, energySources: v.energySources ?? null, description: v.description ?? null } });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<RinFuelCategory>[]>(() => [
    { field: 'dCode',    headerName: 'D-Code',  width: 90, pinned: 'left',
      cellRenderer: (p: { value: string }) => <Tag color={D_CODE_COLOR[p.value] ?? 'default'} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{p.value}</Tag> },
    { field: 'fuelName', headerName: 'Fuel Name', flex: 1.5, minWidth: 200 },
    { field: 'fuelType', headerName: 'Category',  flex: 1,   minWidth: 160, valueFormatter: (p) => FUEL_TYPE_OPTS.find((o) => o.value === p.value)?.label ?? p.value },
    { field: 'equivalenceValue', headerName: 'Equiv. Value', width: 130, type: 'numericColumn',
      cellRenderer: (p: { value: number }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#1677ff' }}>{p.value.toFixed(1)} RINs/gal</span>
      ) },
    { field: 'energySources', headerName: 'Typical Feedstocks', flex: 2, minWidth: 220, cellStyle: { fontSize: 11, color: '#6b7280' }, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 80, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: RinFuelCategory }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.isActive && (
            <Popconfirm title="Deactivate this D-code?" onConfirm={() => deactivate.mutate(p.data.categoryId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ) },
  ], [deactivate]);

  const activeCategories = data.filter((d) => d.isActive);

  return (
    <>
      <PageHeader
        title="RIN Fuel Categories (D-Codes)"
        description="EPA Renewable Fuel Standard D-codes that define what fuel type a RIN represents and how many RINs are generated per gallon via the equivalence value. D-code and equivalence value are mandated by 40 CFR Part 80."
        moduleGroup="rins"
      />
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {activeCategories.map((cat) => (
          <Col key={cat.dCode} xs={12} sm={8} md={6} lg={4}>
            <Card size="small" style={{ textAlign: 'center', borderTop: `3px solid` }}>
              <Tag color={D_CODE_COLOR[cat.dCode] ?? 'default'} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{cat.dCode}</Tag>
              <Statistic value={cat.equivalenceValue} precision={1} suffix="RINs/gal" valueStyle={{ fontSize: 20, fontWeight: 700 }} />
              <div style={{ fontSize: 10, color: '#6b7280', marginTop: 2 }}>{cat.fuelName}</div>
            </Card>
          </Col>
        ))}
      </Row>
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New D-Code" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.categoryId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit — ${editing.dCode} ${editing.fuelName}` : 'New Fuel Category (D-Code)'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="dCode" label={hint('D-Code', 'EPA-defined code: D3 Cellulosic, D4 BBD, D5 Advanced, D6 Conventional, D7 Cellulosic Diesel.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={['D3','D4','D5','D6','D7'].map((d) => ({ value: d, label: d }))} style={{ fontFamily: 'monospace', fontWeight: 700 }} />
            </Form.Item>
            <Form.Item name="equivalenceValue" label={hint('Equiv. Value', 'RINs generated per gallon of renewable fuel. Set by EPA in 40 CFR 80.1415.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber min={0.1} max={10} step={0.1} precision={2} addonAfter="RINs/gal" style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Form.Item name="fuelName" label="Fuel Name" rules={[{ required: true }]}>
            <Input placeholder="Cellulosic Biofuel" />
          </Form.Item>
          <Form.Item name="fuelType" label="Fuel Type Category" rules={[{ required: true }]}>
            <Select options={FUEL_TYPE_OPTS} />
          </Form.Item>
          <Form.Item name="energySources" label={hint('Typical Feedstocks', 'Common feedstocks for this D-code. Informational only — actual feedstock eligibility is determined by EPA pathway.')}>
            <Input placeholder="Corn Stover, Switchgrass, Wood Waste" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Regulatory context, compliance notes, links to EPA pathway documentation." />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
