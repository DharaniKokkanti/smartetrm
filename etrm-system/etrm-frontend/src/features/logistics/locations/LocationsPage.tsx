import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useLocations, useSaveLocation, useDeactivateLocation } from './hooks';
import { LOCATION_TYPE_CODES, type Location, type LocationInput, type LocationTypeCode } from './types';
import { COMMODITY_TYPES, type CommodityType } from '@features/reference/commodity-types/types';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';
import { useCountries } from '@features/reference/countries/hooks';

const TYPE_COLOR: Record<LocationTypeCode, string> = {
  PORT: 'blue', PIPELINE_HUB: 'purple', GAS_HUB: 'cyan', GRID_NODE: 'gold',
  POWER_PLANT: 'orange', WAREHOUSE: 'green', EXCHANGE: 'geekblue', REFINERY: 'volcano',
  LNG_TERMINAL: 'magenta', STORAGE_TANK: 'lime', CUSTOMS_POINT: 'default',
};

export function LocationsPage() {
  const { data, isLoading, refetch } = useLocations();
  const save = useSaveLocation();
  const deactivate = useDeactivateLocation();
  const { data: countries = [] } = useCountries();
  const countryOptions = countries.map((c) => ({ value: c.countryId, label: `${c.countryCode} — ${c.countryName}` }));
  const countryLabelById = new Map(countries.map((c) => [c.countryId, `${c.countryCode} — ${c.countryName}`]));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [form] = Form.useForm<LocationInput>();
  useFormDraft('logistics-locations', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ isActive: true, officeLocInd: false, tradingDeskInd: false }); setOpen(true); }
  function openEdit(l: Location) { setEditing(l); form.setFieldsValue({ locationCode: l.locationCode, locationName: l.locationName, locationTypeCode: l.locationTypeCode, commodityType: l.commodityType, countryId: l.countryId, portCode: l.portCode ?? undefined, unlocode: l.unlocode ?? undefined, operator: l.operator ?? undefined, capacity: l.capacity, capacityUomCode: l.capacityUomCode ?? undefined, latitude: l.latitude, longitude: l.longitude, officeLocInd: l.officeLocInd, tradingDeskInd: l.tradingDeskInd, isActive: l.isActive }); setOpen(true); }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.locationId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Location>[]>(() => [
    { field: 'locationCode', headerName: 'Code', cellClass: 'cell-mono', width: 140, pinned: 'left',
      tooltipValueGetter: () => 'Unique location identifier — used in trade capture for load/discharge, pipeline entry/exit points' },
    { field: 'locationName', headerName: 'Location', flex: 1.4, minWidth: 200 },
    { field: 'locationTypeCode', headerName: 'Type', width: 140, cellRenderer: (p: { value: LocationTypeCode }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace('_', ' ')}</Tag> },
    { field: 'commodityType', headerName: 'Commodity', width: 120, valueFormatter: (p) => p.value ?? 'MULTI',
      cellRenderer: (p: { value: CommodityType | null }) => p.value ? <Tag>{p.value}</Tag> : <Tag color="default">MULTI</Tag> },
    { field: 'countryId', headerName: 'Country', width: 130, valueFormatter: (p) => countryLabelById.get(p.value) ?? String(p.value) },
    { field: 'unlocode', headerName: 'UN/LOCODE', width: 120, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'UN/LOCODE — 5-character code (2-letter country + 3-letter place). Standard for ports and logistics hubs. E.g. GBSUL = Sullom Voe, UK.' },
    { field: 'operator', headerName: 'Operator', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—', tooltipValueGetter: (p) => p.value },
    { field: 'capacity', headerName: 'Capacity', width: 120, cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? `${Number(p.value).toLocaleString()} ${p.data?.capacityUomCode ?? ''}` : '—' },
    { field: 'officeLocInd', headerName: 'Office', width: 90, cellRenderer: (p: { value: boolean }) => p.value ? <Tag color="blue">Office</Tag> : null },
    { field: 'tradingDeskInd', headerName: 'Desk', width: 90, cellRenderer: (p: { value: boolean }) => p.value ? <Tag color="gold">Desk</Tag> : null },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Location }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate location?" onConfirm={() => deactivate.mutate(p.data.locationId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate, countryLabelById]);

  return (
    <>
      <PageHeader title="Locations" description="Delivery and operational points — ports, pipeline hubs, gas hubs, grid nodes, warehouses, refineries, LNG terminals." moduleGroup="logistics" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Location" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.locationId)} />

      <Drawer mask={false} forceRender title={editing ? `Edit Location — ${editing.locationCode}` : 'New Location'} open={open} onClose={() => setOpen(false)} width={540}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="locationCode" label={hint('Location Code', 'Internal unique code. For ports, align with UN/LOCODE where possible. For hubs, use market convention (e.g. NBP for UK gas hub, TTF for Dutch gas hub, CUSHING for WTI delivery point).', 'CUSHING-OK, NBP-UK, SULLOM-VOE')} rules={[{ required: true }]}>
            <Input placeholder="SULLOM-VOE" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="locationName" label={hint('Location Name', 'Full name as used in trade confirmations and transport documents.', 'Sullom Voe Terminal, Shetland Islands')} rules={[{ required: true }]}>
            <Input placeholder="Sullom Voe Terminal" />
          </Form.Item>
          <Form.Item name="locationTypeCode" label={hint('Location Type', 'PORT: marine loading/discharge. PIPELINE_HUB: crude/products pipeline junction. GAS_HUB: virtual gas trading point (NBP, TTF). GRID_NODE: power delivery point. REFINERY: crude processing. LNG_TERMINAL: liquefaction or regasification.', 'PORT')} rules={[{ required: true }]}>
            <Select options={LOCATION_TYPE_CODES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>
          <Form.Item name="commodityType" label={hint('Commodity', 'Commodity handled at this location. Leave blank if multi-commodity (e.g. a port handling crude and products).')}>
            <Select allowClear placeholder="Multi-commodity if blank" options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="countryId" label={hint('Country', 'Country where this location is situated.', 'GB, NL, SA, US')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={countryOptions} showSearch optionFilterProp="label" placeholder="Select country" />
            </Form.Item>
            <Form.Item name="unlocode" label={hint('UN/LOCODE', '5-character international location code: 2-letter country + 3-letter place identifier. Used on Bills of Lading, shipping documents, and customs declarations.', 'GBSUL = Sullom Voe', 'CCPPP')} style={{ flex: 1 }}>
              <Input placeholder="GBSUL" maxLength={5} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="portCode" label={hint('Port Code', 'Exchange or industry-specific port code (e.g. Lloyd\'s of London port codes for vessel vetting).', 'SUL')} style={{ flex: 1 }}>
              <Input placeholder="SUL" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Form.Item name="operator" label={hint('Operator', 'Company that operates this terminal, hub, or facility. Relevant for NOR tendering and berthing arrangements.', 'BP plc, Shell Trading')}>
            <Input placeholder="Operator name" />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="capacity" label={hint('Capacity', 'Storage or throughput capacity of this facility.', '12,000,000 BBL')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="12000000" />
            </Form.Item>
            <Form.Item name="capacityUomCode" label="Capacity UoM" style={{ flex: 1 }}>
              <Input placeholder="BBL" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="latitude" label={hint('Latitude', 'GPS latitude in decimal degrees. Used for port distance calculations and vessel routing.', '60.4833')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="60.4833" step={0.0001} />
            </Form.Item>
            <Form.Item name="longitude" label="Longitude" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="-1.3167" step={0.0001} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 24 }}>
            <Form.Item name="officeLocInd" label={hint('Office Location', 'This location is a business office — not a physical delivery or operational point.')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="tradingDeskInd" label={hint('Trading Desk Location', 'Subset of office locations that actually host a trading desk — appears in the desk-location picker.')} valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
