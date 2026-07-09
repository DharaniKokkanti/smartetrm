import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useStorageFacilities, useSaveStorageFacility, useDeactivateStorageFacility } from './hooks';
import { STORAGE_STATUS_CODES, type StorageFacility, type StorageFacilityInput, type StorageStatusCode } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';

const TYPE_COLOR: Record<string, string> = {
  'Tank Farm': 'blue',
  'Salt Cavern': 'gold',
  'Gas Storage': 'cyan',
  'LNG Tank': 'purple',
  'Floating Storage': 'geekblue',
  'Warehouse': 'default',
  'Pipeline Linefill': 'volcano',
  'Silo': 'lime',
  'Refrigerated Storage': 'blue',
  'Chemical Tank': 'orange',
  'FSRU': 'geekblue',
  'Refinery': 'volcano',
  'Vault': 'magenta',
  'Other': 'default',
};

const STATUS_COLOR: Record<StorageStatusCode, string> = {
  OPERATIONAL: 'success',
  UNDER_MAINTENANCE: 'warning',
  DECOMMISSIONED: 'error',
};

export function StoragePage() {
  const { data, isLoading, refetch } = useStorageFacilities();
  const save = useSaveStorageFacility();
  const deactivate = useDeactivateStorageFacility();
  const { data: storageTypeOptions = [], isLoading: loadingStorageTypes } = useCustomConfigOptions('STORAGE_FACILITY_TYPE');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<StorageFacility | null>(null);
  const [form] = Form.useForm<StorageFacilityInput>();
  useFormDraft('logistics-storage', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('isActive', true);
    form.setFieldValue('statusCode', 'OPERATIONAL');
    setOpen(true);
  }

  function openEdit(s: StorageFacility) {
    setEditing(s);
    form.setFieldsValue({
      storageCode: s.storageCode,
      storageName: s.storageName,
      storageType: s.storageType,
      locationId: s.locationId ?? undefined,
      locationCode: s.locationCode ?? undefined,
      commodityType: s.commodityType ?? undefined,
      capacity: s.capacity,
      capacityUomCode: s.capacityUomCode,
      operatorName: s.operatorName,
      countryCode: s.countryCode,
      regulatoryRef: s.regulatoryRef ?? undefined,
      injectionRate: s.injectionRate ?? undefined,
      withdrawalRate: s.withdrawalRate ?? undefined,
      statusCode: s.statusCode,
      isActive: s.isActive,
    });
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const input: StorageFacilityInput = {
      ...v,
      locationId: v.locationId ?? null,
      locationCode: v.locationCode ?? null,
      commodityType: v.commodityType ?? null,
      regulatoryRef: v.regulatoryRef ?? null,
      injectionRate: v.injectionRate ?? null,
      withdrawalRate: v.withdrawalRate ?? null,
    };
    const saved = await save.mutateAsync({ id: editing?.storageId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<StorageFacility>[]>(() => [
    { field: 'storageCode', headerName: 'Code', cellClass: 'cell-mono', width: 160, pinned: 'left' },
    { field: 'storageName', headerName: 'Name', flex: 1.5, minWidth: 180 },
    {
      field: 'storageType', headerName: 'Type', width: 170,
      cellRenderer: (p: { value: number }) => {
        const label = storageTypeOptions.find((o) => o.value === p.value)?.label ?? '—';
        return <Tag color={TYPE_COLOR[label] ?? 'default'}>{label}</Tag>;
      },
    },
    {
      field: 'commodityType', headerName: 'Commodity', width: 110,
      valueFormatter: (p) => p.value ?? '—',
    },
    {
      headerName: 'Capacity', width: 150,
      valueGetter: (p) => p.data ? `${p.data.capacity.toLocaleString()} ${p.data.capacityUomCode}` : '',
    },
    { field: 'operatorName', headerName: 'Operator', flex: 1 },
    { field: 'countryCode', headerName: 'Country', width: 90 },
    {
      field: 'statusCode', headerName: 'Status', width: 140,
      cellRenderer: (p: { value: StorageStatusCode }) => (
        <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag>
      ),
    },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: StorageFacility }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate storage facility?" onConfirm={() => deactivate.mutate(p.data.storageId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate, storageTypeOptions]);

  return (
    <>
      <PageHeader
        title="Storage Facilities"
        description="Tank farms, gas storage, LNG terminals, salt caverns and warehouses. Capacity and throughput tracking for physical inventory management."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Storage Facility"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.storageId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Storage — ${editing.storageCode}` : 'New Storage Facility'}
        open={open}
        onClose={() => setOpen(false)}
        width={600}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="storageCode"
            label={hint('Storage Code', 'Unique code used across logistics and trading — CUSHING-T1, NBP-HUMBLY-GROVE.', 'CUSHING-T1')}
            rules={[{ required: true, message: 'Storage code is required' }]}
          >
            <Input placeholder="CUSHING-T1" style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Form.Item
            name="storageName"
            label="Storage Name"
            rules={[{ required: true, message: 'Storage name is required' }]}
          >
            <Input placeholder="Cushing Tank Farm 1" />
          </Form.Item>

          <Form.Item
            name="storageType"
            label={hint('Storage Type', 'TANK_FARM = above-ground steel tanks. SALT_CAVERN = underground, ideal for gas (fast injection/withdrawal). PIPELINE_LINEFILL = inventory in transit within pipeline.')}
            rules={[{ required: true, message: 'Storage type is required' }]}
          >
            <Select options={storageTypeOptions} loading={loadingStorageTypes} />
          </Form.Item>

          <Form.Item name="locationCode" label="Location Code">
            <Input placeholder="CUSHING-OK" />
          </Form.Item>

          <Form.Item name="commodityType" label="Commodity Type">
            <Input placeholder="OIL / GAS / METALS" />
          </Form.Item>

          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item
              name="capacity"
              label="Capacity"
              rules={[{ required: true, message: 'Capacity is required' }]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="500000" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item
              name="capacityUomCode"
              label="UOM"
              rules={[{ required: true, message: 'Unit of measure is required' }]}
              style={{ flex: 1 }}
            >
              <Input placeholder="BBL / M3 / MT" />
            </Form.Item>
          </Space>

          <Form.Item
            name="operatorName"
            label="Operator"
            rules={[{ required: true, message: 'Operator is required' }]}
          >
            <Input placeholder="Operator name" />
          </Form.Item>

          <Form.Item
            name="countryCode"
            label="Country Code"
            rules={[{ required: true, message: 'Country code is required' }]}
          >
            <Input placeholder="US" maxLength={2} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>

          <Form.Item
            name="regulatoryRef"
            label={hint('Regulatory Reference', 'Regulatory permit / consent number from national energy authority — FERC (US), Ofgem (UK), BNetzA (DE).', 'FERC-TSA-001')}
          >
            <Input placeholder="FERC-TSA-001" />
          </Form.Item>

          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item
              name="injectionRate"
              label={hint('Injection Rate (per day)', 'Max commodity injection per day — critical for gas storage optimization and seasonal swing contracts.')}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="10000" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item
              name="withdrawalRate"
              label="Withdrawal Rate (per day)"
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} placeholder="15000" min={0} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Space>

          <Form.Item
            name="statusCode"
            label="Status"
            rules={[{ required: true, message: 'Status is required' }]}
          >
            <Select options={STORAGE_STATUS_CODES.map((s) => ({ label: s.replace(/_/g, ' '), value: s }))} />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
