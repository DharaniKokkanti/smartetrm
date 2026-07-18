import { useMemo, useState } from 'react';
import { Button, Drawer, Form, Input, Select, DatePicker, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AuditInfo } from '@components/smart/AuditInfo';
import { useVessels } from '@features/logistics/vessels/hooks';
import { useLocations } from '@features/logistics/locations/hooks';
import { useVoyages, useSaveVoyage } from './hooks';
import { VOYAGE_STATUSES, LADEN_BALLAST_STATUSES, type Voyage, type VoyageInput, type VoyageStatus } from './types';

const STATUS_COLOR: Record<VoyageStatus, string> = {
  PLANNED: 'default', IN_PROGRESS: 'processing', COMPLETED: 'success', CANCELLED: 'error',
};

export function VoyagesPage() {
  const { data, isLoading, refetch } = useVoyages();
  const save = useSaveVoyage();
  const { data: vessels = [] } = useVessels();
  const { data: locations = [] } = useLocations();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Voyage | null>(null);
  const [form] = Form.useForm<VoyageInput>();

  const vesselOptions = vessels.map((v) => ({ value: v.vesselId, label: v.vesselName }));
  const locationOptions = locations.map((l) => ({ value: l.locationId, label: `${l.locationCode} — ${l.locationName}` }));

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('status', 'PLANNED');
    form.setFieldValue('isActive', true);
    setOpen(true);
  }

  function openEdit(v: Voyage) {
    setEditing(v);
    form.setFieldsValue({
      voyageNumber: v.voyageNumber, vesselId: v.vesselId, charterPartyId: v.charterPartyId,
      status: v.status, ladenBallastStatus: v.ladenBallastStatus ?? undefined,
      laycanStart: v.laycanStart ? (dayjs(v.laycanStart) as unknown as string) : undefined,
      laycanEnd: v.laycanEnd ? (dayjs(v.laycanEnd) as unknown as string) : undefined,
      loadLocationId: v.loadLocationId ?? undefined, dischargeLocationId: v.dischargeLocationId ?? undefined,
      notes: v.notes ?? undefined, isActive: v.isActive,
    });
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    const input: VoyageInput = {
      ...v,
      laycanStart: v.laycanStart ? dayjs(v.laycanStart as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
      laycanEnd: v.laycanEnd ? dayjs(v.laycanEnd as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
      charterPartyId: v.charterPartyId ?? null,
      eta: null,
      etd: null,
    };
    await save.mutateAsync({ id: editing?.voyageId ?? null, input });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<Voyage>[]>(() => [
    { field: 'voyageNumber', headerName: 'Voyage #', width: 140, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'vesselName', headerName: 'Vessel', flex: 1, minWidth: 160 },
    { field: 'status', headerName: 'Status', width: 130, cellRenderer: (p: { value: VoyageStatus }) => <Tag color={STATUS_COLOR[p.value]}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'ladenBallastStatus', headerName: 'Leg', width: 100, valueFormatter: (p) => p.value ?? '—' },
    { field: 'laycanStart', headerName: 'Laycan Start', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'laycanEnd', headerName: 'Laycan End', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'loadLocationName', headerName: 'Load Port', width: 150, valueFormatter: (p) => p.value ?? '—' },
    { field: 'dischargeLocationName', headerName: 'Discharge Port', width: 150, valueFormatter: (p) => p.value ?? '—' },
    { field: 'cpReference', headerName: 'CP Reference', width: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 60, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<Voyage>) => (
        <Button size="small" type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); if (p.data) openEdit(p.data); }} />
      ),
    },
  ], []);

  return (
    <div>
      <PageHeader title="Voyages" description="Voyage spine — vessel, charter party, laycan, and route. Open a row for cargo parcels, bunker stems, SOF events, and laytime." moduleGroup="Freight & Shipping" />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Voyage"
        onRefresh={() => void refetch()}
        getRowId={(p) => String(p.data.voyageId)}
        onRowClicked={(e) => { if (e.data) navigate(`/voyage-ops/voyages/${e.data.voyageId}`); }}
      />
      <Drawer title={editing ? `Edit Voyage ${editing.voyageNumber}` : 'New Voyage'} open={open} onClose={() => setOpen(false)} width={480}
        extra={<Button type="primary" onClick={() => void submit()} loading={save.isPending}>Save</Button>}>
        <Form form={form} layout="vertical">
          <Form.Item name="voyageNumber" label="Voyage Number" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="vesselId" label="Vessel" rules={[{ required: true }]}><Select options={vesselOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={VOYAGE_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="ladenBallastStatus" label="Laden / Ballast">
            <Select allowClear options={LADEN_BALLAST_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="laycanStart" label="Laycan Start"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="laycanEnd" label="Laycan End"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="loadLocationId" label="Load Port"><Select allowClear showSearch optionFilterProp="label" options={locationOptions} /></Form.Item>
          <Form.Item name="dischargeLocationId" label="Discharge Port"><Select allowClear showSearch optionFilterProp="label" options={locationOptions} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="isActive" hidden initialValue={true}><Input /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} createdBy={editing?.createdBy} updatedAt={editing?.updatedAt} updatedBy={editing?.updatedBy} />
      </Drawer>
    </div>
  );
}
