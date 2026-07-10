import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { useTableRows } from '@features/tier2/hooks';
import { COMMODITY_TYPES_TRADE } from '@features/trade/types';
import { useTanks, useSaveTank, useDeactivateTank } from './hooks';
import { TANK_TYPES, TANK_STATUSES, type Tank, type TankInput } from './types';

const STATUS_COLOR: Record<string, string> = {
  IN_SERVICE: 'success', MAINTENANCE: 'warning', CLEANING: 'blue', INSPECTION: 'orange', MOTHBALLED: 'default', DECOMMISSIONED: 'error',
};

export function TanksPage() {
  const { data = [], isLoading, refetch } = useTanks();
  const save = useSaveTank();
  const deactivate = useDeactivateTank();
  const { data: facilityRows = [] } = useTableRows('storage_facility');
  const { data: productRows = [] } = useTableRows('product');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tank | null>(null);
  const [form] = Form.useForm<TankInput>();
  useFormDraft('tanks', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ tankType: 'FIXED_ROOF', tankStatus: 'IN_SERVICE', isHeated: false, hasMetering: true, isActive: true } as unknown as TankInput);
    setOpen(true);
  }

  function openEdit(r: Tank) {
    setEditing(r);
    form.setFieldsValue(r as unknown as TankInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.tankId ?? null, input: values });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const facilityOpts = useMemo(
    () => (facilityRows as unknown as { facilityId: number; facilityCode: string; facilityName: string }[])
      .map((f) => ({ value: f.facilityId, label: `${f.facilityCode} — ${f.facilityName}` })),
    [facilityRows],
  );
  const productOpts = useMemo(
    () => (productRows as unknown as { productId: number; productCode: string; productName: string }[])
      .map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` })),
    [productRows],
  );

  const colDefs = useMemo<ColDef<Tank>[]>(() => [
    { field: 'tankNumber', headerName: 'Tank #', width: 110, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'facilityName', headerName: 'Facility', flex: 1, minWidth: 150 },
    { field: 'tankType', headerName: 'Type', width: 130, cellRenderer: (p: { value: string }) => <Tag style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'commodityType', headerName: 'Commodity', width: 110 },
    { field: 'nominalCapacityM3', headerName: 'Capacity (m³)', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'tankStatus', headerName: 'Status', width: 110,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Tank }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this tank?" onConfirm={() => deactivate.mutate(p.data.tankId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader
        title="Tanks"
        description="Individual storage tanks within a facility — capacity, product grade, heating, metering, and current operational status."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Tank"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.tankId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Tank — ${editing.tankNumber}` : 'New Tank'}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="facilityId" label="Storage Facility" rules={[{ required: true }]}>
            <Select options={facilityOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="tankNumber" label="Tank Number" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="tankName" label="Tank Name">
            <Input />
          </Form.Item>
          <Form.Item name="tankType" label={hint('Tank Type', 'Floating/internal-float roofs reduce vapor loss for volatile products. Cryogenic is LNG-only. Pressure spheres are for LPG/NGLs.')} rules={[{ required: true }]}>
            <Select options={TANK_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="commodityType" label="Commodity Type" rules={[{ required: true }]}>
            <Select options={COMMODITY_TYPES_TRADE.map((c) => ({ value: c, label: c }))} />
          </Form.Item>
          <Form.Item name="primaryProductId" label="Primary Product">
            <Select options={productOpts} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="nominalCapacityM3" label="Nominal Capacity (m³)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="workingCapacityM3" label="Working Capacity (m³)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="heelVolumeM3" label={hint('Heel Volume (m³)', 'Minimum/unavoidable residual volume that can never be drawn down.')}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="diameterM" label="Diameter (m)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="heightM" label="Height (m)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="isHeated" label={hint('Heated', 'For heavy crude / fuel oil that must be kept above a minimum temperature to remain pumpable.')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.isHeated !== c.isHeated}>
            {({ getFieldValue }) => getFieldValue('isHeated') && (
              <Form.Item name="maxTempCelsius" label="Max Temperature (°C)">
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item name="hasMetering" label="Has Metering" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.hasMetering !== c.hasMetering}>
            {({ getFieldValue }) => getFieldValue('hasMetering') && (
              <Form.Item name="meterRef" label="Meter Reference">
                <Input />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item name="tankStatus" label="Status" rules={[{ required: true }]}>
            <Select options={TANK_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
