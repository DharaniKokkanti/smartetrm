import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, InputNumber, Select, Switch } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import type { ReferenceDataRow } from '@models/referenceData';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { useTableRows } from '@features/tier2/hooks';
import { useLocations } from '@features/logistics/locations/hooks';
import { COMMODITY_TYPES } from '@features/organization/desks/types';
import { useTransportRoutes, useSaveTransportRoute } from './hooks';
import type { TransportRoute, TransportRouteInput } from './types';

export function TransportRoutesPage() {
  const { data = [], isLoading, refetch } = useTransportRoutes();
  const save = useSaveTransportRoute();
  const { data: locations = [] } = useLocations();
  const { data: motTypes = [] } = useTableRows('mot_type');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TransportRoute | null>(null);
  const [form] = Form.useForm<TransportRouteInput>();
  useFormDraft('transport-routes', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true } as unknown as TransportRouteInput);
    setOpen(true);
  }

  function openEdit(r: TransportRoute) {
    setEditing(r);
    form.setFieldsValue({ ...r } as unknown as TransportRouteInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const input: TransportRouteInput = { ...values };
    const saved = await save.mutateAsync({ id: editing?.routeId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const locationOpts = useMemo(
    () => (locations as { locationId: number; locationCode: string; locationName: string }[]).map((l) => ({ value: l.locationId, label: `${l.locationCode} — ${l.locationName}` })),
    [locations],
  );

  const motTypeOpts = useMemo(
    () => (motTypes as ReferenceDataRow[]).map((m) => ({ value: m['motTypeId'] as number, label: m['typeName'] as string })),
    [motTypes],
  );

  const colDefs = useMemo<ColDef<TransportRoute>[]>(() => [
    { field: 'routeCode', headerName: 'Route Code', width: 130, cellClass: 'cell-mono', pinned: 'left' },
    { field: 'routeName', headerName: 'Route Name', flex: 1, minWidth: 220 },
    { field: 'motTypeName', headerName: 'MOT', width: 100, valueFormatter: (p) => p.value ?? '—' },
    { field: 'originLocationName', headerName: 'Origin', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'destLocationName', headerName: 'Destination', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'distanceKm', headerName: 'Distance (km)', width: 130, valueFormatter: (p) => (p.value != null ? Number(p.value).toLocaleString() : '—') },
    {
      headerName: 'Transit Days', width: 130,
      valueGetter: (p) => (p.data?.transitDaysMin != null || p.data?.transitDaysMax != null ? `${p.data?.transitDaysMin ?? '?'}–${p.data?.transitDaysMax ?? '?'}` : '—'),
    },
    { field: 'commodityType', headerName: 'Commodity', width: 120, valueFormatter: (p) => p.value ?? 'ALL', cellRenderer: (p: { value: string | null }) => <Tag>{p.value ?? 'ALL'}</Tag> },
    { field: 'maxVesselSize', headerName: 'Max Vessel Size', width: 140, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 90,
      cellRenderer: (p: { value: boolean }) => <Tag color={p.value ? 'success' : 'default'}>{p.value ? 'Yes' : 'No'}</Tag>,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: TransportRoute }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Transport Routes"
        description="Standard freight routes — Ras Tanura to Rotterdam, WAF to USG — with benchmark voyage days and typical freight, used to validate laycan feasibility and estimate freight cost on physical trades."
        moduleGroup="freight"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Route"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.routeId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Transport Route' : 'New Transport Route'}
        open={open}
        onClose={() => setOpen(false)}
        width={460}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="routeCode" label="Route Code" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} placeholder="e.g. RT-ROT-VLCC" />
          </Form.Item>
          <Form.Item name="routeName" label="Route Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Ras Tanura to Rotterdam" />
          </Form.Item>
          <Form.Item
            name="motTypeId"
            label={hint('Mode of Transport', 'The physical transport mode used on this route — sea vessel, pipeline, road tanker, rail car, or barge. Determines which asset types and Incoterms apply.')}
            rules={[{ required: true }]}
          >
            <Select options={motTypeOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="originLocationId" label="Origin Location" rules={[{ required: true }]}>
            <Select options={locationOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="destLocationId"
            label="Destination Location"
            dependencies={['originLocationId']}
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || value !== getFieldValue('originLocationId')) return Promise.resolve();
                  return Promise.reject(new Error('Destination must differ from origin'));
                },
              }),
            ]}
          >
            <Select options={locationOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="viaLocationIds"
            label={hint('Via Locations', 'Optional intermediate stops (e.g. bunkering or transhipment points) between origin and destination — comma-separated location IDs.', '6,7')}
          >
            <Input placeholder="Comma-separated location IDs, optional" />
          </Form.Item>
          <Form.Item name="distanceKm" label="Distance (km)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Space.Compact style={{ width: '100%' }}>
            <Form.Item name="transitDaysMin" label="Transit Days Min" style={{ width: '50%' }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="transitDaysMax" label="Transit Days Max" style={{ width: '50%' }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="commodityType" label="Commodity Type (blank = all)">
            <Select allowClear options={COMMODITY_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item
            name="maxVesselSize"
            label={hint('Max Vessel Size', 'Largest vessel class this route/berth can accommodate — e.g. VLCC, SUEZMAX, AFRAMAX, PANAMAX for tankers.')}
          >
            <Input placeholder="e.g. SUEZMAX" />
          </Form.Item>
          <Form.Item name="seasonalRestriction" label="Seasonal Restriction">
            <Input placeholder="e.g. Winter: ice class required" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
