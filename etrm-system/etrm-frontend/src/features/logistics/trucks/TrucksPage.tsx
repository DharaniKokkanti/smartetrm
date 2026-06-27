import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber, DatePicker } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { ExpiryBadge } from '@components/smart/ExpiryBadge';
import { hint } from '@components/smart/FieldHint';
import { useTrucks, useSaveTruck, useDeactivateTruck } from './hooks';
import { VEHICLE_TYPES, VEHICLE_STATUS_CODES, type Truck, type TruckInput, type VehicleType, type VehicleStatusCode } from './types';

const TYPE_COLOR: Record<VehicleType, string> = {
  ROAD_TANKER: 'blue',
  DRY_BULK: 'orange',
  FLATBED: 'default',
  REFRIGERATED: 'cyan',
  ISOTANK: 'purple',
  CONTAINER: 'green',
};

const STATUS_COLOR: Record<VehicleStatusCode, string> = {
  ACTIVE: 'success',
  IN_SERVICE: 'processing',
  MAINTENANCE: 'warning',
  RETIRED: 'error',
};

export function TrucksPage() {
  const { data, isLoading, refetch } = useTrucks();
  const save = useSaveTruck();
  const deactivate = useDeactivateTruck();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Truck | null>(null);
  const [form] = Form.useForm<TruckInput>();

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('isActive', true);
    form.setFieldValue('statusCode', 'ACTIVE');
    setOpen(true);
  }

  function openEdit(t: Truck) {
    setEditing(t);
    form.setFieldsValue({
      vehicleCode: t.vehicleCode,
      vehicleName: t.vehicleName ?? undefined,
      vehicleType: t.vehicleType,
      licensePlate: t.licensePlate,
      operatorName: t.operatorName,
      capacity: t.capacity,
      capacityUomCode: t.capacityUomCode,
      countryCode: t.countryCode,
      gvwTonnes: t.gvwTonnes ?? undefined,
      licenseExpiryDate: t.licenseExpiryDate ? (dayjs(t.licenseExpiryDate) as unknown as string) : undefined,
      inspectionExpiryDate: t.inspectionExpiryDate ? (dayjs(t.inspectionExpiryDate) as unknown as string) : undefined,
      adrCertExpiry: t.adrCertExpiry ? (dayjs(t.adrCertExpiry) as unknown as string) : undefined,
      commodityType: t.commodityType ?? undefined,
      statusCode: t.statusCode,
      isActive: t.isActive,
    });
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    const input: TruckInput = {
      ...v,
      vehicleName: v.vehicleName ?? null,
      gvwTonnes: v.gvwTonnes ?? null,
      commodityType: v.commodityType ?? null,
      licenseExpiryDate: v.licenseExpiryDate
        ? dayjs(v.licenseExpiryDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD')
        : null,
      inspectionExpiryDate: v.inspectionExpiryDate
        ? dayjs(v.inspectionExpiryDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD')
        : null,
      adrCertExpiry: v.adrCertExpiry
        ? dayjs(v.adrCertExpiry as unknown as dayjs.Dayjs).format('YYYY-MM-DD')
        : null,
    };
    await save.mutateAsync({ id: editing?.vehicleId ?? null, input });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<Truck>[]>(() => [
    { field: 'vehicleCode', headerName: 'Code', cellClass: 'cell-mono', width: 110, pinned: 'left' },
    { field: 'licensePlate', headerName: 'License Plate', width: 140, cellClass: 'cell-mono' },
    {
      field: 'vehicleType', headerName: 'Type', width: 140,
      cellRenderer: (p: { value: VehicleType }) => (
        <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag>
      ),
    },
    { field: 'operatorName', headerName: 'Operator', flex: 1 },
    {
      headerName: 'Capacity', width: 130,
      valueGetter: (p) => p.data ? `${p.data.capacity.toLocaleString()} ${p.data.capacityUomCode}` : '',
    },
    { field: 'countryCode', headerName: 'Country', width: 90 },
    {
      field: 'inspectionExpiryDate', headerName: 'Inspection Expiry', width: 160,
      cellRenderer: (p: { value: string | null }) =>
        p.value ? <ExpiryBadge expiryDate={p.value} /> : <Tag color="default">—</Tag>,
    },
    {
      field: 'adrCertExpiry', headerName: 'ADR Expiry', width: 140,
      cellRenderer: (p: { value: string | null }) =>
        p.value ? <ExpiryBadge expiryDate={p.value} /> : <Tag color="default">—</Tag>,
    },
    {
      field: 'statusCode', headerName: 'Status', width: 120,
      cellRenderer: (p: { value: VehicleStatusCode }) => (
        <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag>
      ),
    },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Truck }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate truck?" onConfirm={() => deactivate.mutate(p.data.vehicleId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Road Transport — Trucks"
        description="Road tankers, dry bulk, isotanks and container vehicles. Tracks ADR hazmat certifications and inspection expiry dates."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Truck"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.vehicleId)}
      />

      <Drawer
        title={editing ? `Edit Truck — ${editing.vehicleCode}` : 'New Truck'}
        open={open}
        onClose={() => setOpen(false)}
        width={600}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item
              name="vehicleCode"
              label="Vehicle Code"
              rules={[{ required: true, message: 'Vehicle code is required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="TRK-001" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="vehicleName" label="Vehicle Name" style={{ flex: 1 }}>
              <Input placeholder="Nordic Tanker 1" />
            </Form.Item>
          </Space>

          <Form.Item
            name="vehicleType"
            label="Vehicle Type"
            rules={[{ required: true, message: 'Vehicle type is required' }]}
          >
            <Select options={VEHICLE_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>

          <Form.Item
            name="licensePlate"
            label={hint('License Plate', 'Vehicle registration number — must match CMR/transport documents exactly.', 'LK21 ABT')}
            rules={[{ required: true, message: 'License plate is required' }]}
          >
            <Input placeholder="LK21 ABT" />
          </Form.Item>

          <Form.Item
            name="operatorName"
            label="Operator"
            rules={[{ required: true, message: 'Operator is required' }]}
          >
            <Input placeholder="Operator name" />
          </Form.Item>

          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item
              name="capacity"
              label="Capacity"
              rules={[{ required: true, message: 'Capacity is required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="30000" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item
              name="capacityUomCode"
              label="UOM"
              rules={[{ required: true, message: 'Unit of measure is required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="LTR / MT / M3" />
            </Form.Item>
          </Space>

          <Form.Item
            name="countryCode"
            label="Country Code"
            rules={[{ required: true, message: 'Country code is required' }]}
          >
            <Input placeholder="GB" maxLength={2} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="gvwTonnes"
            label={hint('GVW (Tonnes)', 'Gross Vehicle Weight in tonnes — determines road tax class and bridge/route restrictions. Crude tankers typically 30-44 tonnes GVW.', '44')}
          >
            <InputNumber style={{ width: '100%' }} placeholder="44" min={0} />
          </Form.Item>

          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="licenseExpiryDate" label="License Expiry" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item name="inspectionExpiryDate" label="Inspection Expiry" style={{ flex: 1 }}>
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Space>

          <Form.Item
            name="adrCertExpiry"
            label={hint('ADR Cert Expiry', 'ADR = European Agreement on International Carriage of Dangerous Goods by Road. Required for petroleum products. Renewed every 5 years.', '2027-01-01')}
          >
            <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
          </Form.Item>

          <Form.Item name="commodityType" label="Commodity Type">
            <Input placeholder="OIL / GAS / AGRICULTURAL" />
          </Form.Item>

          <Form.Item
            name="statusCode"
            label="Status"
            rules={[{ required: true, message: 'Status is required' }]}
          >
            <Select options={VEHICLE_STATUS_CODES.map((s) => ({ label: s.replace(/_/g, ' '), value: s }))} />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
