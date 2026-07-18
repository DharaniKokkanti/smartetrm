import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tag, Spin, Button, Table, Modal, Form, Select, InputNumber, DatePicker, Input, Space, Typography } from 'antd';
import { ArrowLeftOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { useLocations } from '@features/logistics/locations/hooks';
import { useProducts } from '@features/markets/products/hooks';
import { useUom } from '@features/reference/uom/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useVoyage } from './hooks';
import { useCargoParcels, useSaveCargoParcel } from '../cargo-parcels/hooks';
import type { VoyageCargoParcelInput } from '../cargo-parcels/types';
import { useBunkerStems, useSaveBunkerStem } from '../bunker-stems/hooks';
import type { BunkerStemInput } from '../bunker-stems/types';
import { BUNKER_STEM_STATUSES } from '../bunker-stems/types';
import { useSofEvents, useSaveSofEvent } from '../sof-events/hooks';
import type { VoyageSofEventInput } from '../sof-events/types';
import { useLaytimeCalculations, useCreateLaytimeCalculation } from '../laytime-calculations/hooks';
import type { LaytimeCalculationInput } from '../laytime-calculations/types';

const { Text } = Typography;

export function VoyageWorkspace() {
  const { id } = useParams();
  const voyageId = Number(id);
  const navigate = useNavigate();
  const { data: voyage, isLoading } = useVoyage(voyageId);

  if (isLoading || !voyage) {
    return <Spin style={{ margin: 40 }} />;
  }

  return (
    <div>
      <PageHeader
        title={`Voyage ${voyage.voyageNumber}`}
        description={`${voyage.vesselName ?? 'Vessel'} — ${voyage.status.replace(/_/g, ' ')}${voyage.cpReference ? ` — CP ${voyage.cpReference}` : ''}`}
        moduleGroup="Freight & Shipping"
        extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/voyage-ops/voyages')}>Back to Voyages</Button>}
      />
      <Space size="large" style={{ marginBottom: 16 }}>
        <Text type="secondary">Laycan: {voyage.laycanStart ?? '—'} → {voyage.laycanEnd ?? '—'}</Text>
        <Text type="secondary">Load: {voyage.loadLocationName ?? '—'}</Text>
        <Text type="secondary">Discharge: {voyage.dischargeLocationName ?? '—'}</Text>
        <Tag>{voyage.ladenBallastStatus ?? 'N/A'}</Tag>
      </Space>
      <Tabs
        items={[
          { key: 'parcels', label: 'Cargo Parcels', children: <CargoParcelsTab voyageId={voyageId} /> },
          { key: 'bunkers', label: 'Bunker Stems', children: <BunkerStemsTab voyageId={voyageId} vesselId={voyage.vesselId} /> },
          { key: 'sof', label: 'SOF Events', children: <SofEventsTab voyageId={voyageId} /> },
          { key: 'laytime', label: 'Laytime Calculations', children: <LaytimeTab voyageId={voyageId} /> },
        ]}
      />
    </div>
  );
}

function CargoParcelsTab({ voyageId }: { voyageId: number }) {
  const { data = [], isLoading } = useCargoParcels(voyageId);
  const save = useSaveCargoParcel();
  const { data: products = [] } = useProducts();
  const { data: uoms = [] } = useUom();
  const { data: locations = [] } = useLocations();
  const { data: commodityTypes = [] } = useTableRows<{ commodityTypeId: number; typeCode: string }>('commodity_type');
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<VoyageCargoParcelInput>();

  async function submit() {
    const v = await form.validateFields();
    await save.mutateAsync({ id: null, input: { ...v, voyageId, isActive: true } });
    setOpen(false);
    form.resetFields();
  }

  return (
    <div>
      <Button icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Add Cargo Parcel</Button>
      <Table
        rowKey="cargoParcelId"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'Product', dataIndex: 'productName', render: (v) => v ?? '—' },
          { title: 'Commodity', dataIndex: 'commodityTypeCode', render: (v) => v ?? '—' },
          { title: 'Quantity', dataIndex: 'quantity', render: (v: number) => v.toLocaleString() },
          { title: 'UOM', dataIndex: 'uomCode' },
          { title: 'Load Terminal', dataIndex: 'loadTerminalName', render: (v) => v ?? '—' },
          { title: 'Discharge Terminal', dataIndex: 'dischargeTerminalName', render: (v) => v ?? '—' },
          { title: 'Trade Order', dataIndex: 'tradeOrderId', render: (v) => v ?? '—' },
        ]}
      />
      <Modal title="Add Cargo Parcel" open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} confirmLoading={save.isPending}>
        <Form form={form} layout="vertical">
          <Form.Item name="productId" label="Product (Grade)"><Select showSearch optionFilterProp="label" allowClear
            options={products.map((p) => ({ value: p.productId, label: p.productName }))} /></Form.Item>
          <Form.Item name="commodityTypeId" label="Commodity Type (defaults from Product if left blank)">
            <Select allowClear showSearch optionFilterProp="label"
              options={commodityTypes.map((c) => ({ value: c.commodityTypeId, label: c.typeCode }))} />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="uomId" label="UOM" rules={[{ required: true }]}><Select showSearch optionFilterProp="label"
            options={uoms.map((u) => ({ value: u.uomId, label: u.uomCode }))} /></Form.Item>
          <Form.Item name="loadTerminalLocationId" label="Load Terminal"><Select allowClear showSearch optionFilterProp="label"
            options={locations.map((l) => ({ value: l.locationId, label: l.locationName }))} /></Form.Item>
          <Form.Item name="dischargeTerminalLocationId" label="Discharge Terminal"><Select allowClear showSearch optionFilterProp="label"
            options={locations.map((l) => ({ value: l.locationId, label: l.locationName }))} /></Form.Item>
          <Form.Item name="tradeOrderId" label="Trade Order ID (optional link)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="tradeItemId" label="Trade Item ID (optional link)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function BunkerStemsTab({ voyageId, vesselId }: { voyageId: number; vesselId: number }) {
  const { data = [], isLoading } = useBunkerStems({ voyageId });
  const save = useSaveBunkerStem();
  const { data: fuelGrades = [] } = useTableRows<{ fuelGradeId: number; gradeCode: string }>('bunker_fuel_grade');
  const { data: locations = [] } = useLocations();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<BunkerStemInput>();

  async function submit() {
    const v = await form.validateFields();
    const input: BunkerStemInput = {
      ...v,
      voyageId,
      vesselId,
      isActive: true,
      stemDate: v.stemDate ? dayjs(v.stemDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    };
    await save.mutateAsync({ id: null, input });
    setOpen(false);
    form.resetFields();
  }

  return (
    <div>
      <Button icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Add Bunker Stem</Button>
      <Table
        rowKey="bunkerStemId"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'Fuel Grade', dataIndex: 'fuelGradeCode', render: (v) => v ?? '—' },
          { title: 'Quantity (MT)', dataIndex: 'quantityMt', render: (v: number) => v.toLocaleString() },
          { title: 'Price/MT', dataIndex: 'pricePerMt', render: (v) => v ?? '—' },
          { title: 'ROB After', dataIndex: 'robAfterMt', render: (v) => v ?? '—' },
          { title: 'Port', dataIndex: 'portLocationName', render: (v) => v ?? '—' },
          { title: 'Supplier', dataIndex: 'supplierName', render: (v) => v ?? '—' },
          { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v}</Tag> },
        ]}
      />
      <Modal title="Add Bunker Stem" open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} confirmLoading={save.isPending}>
        <Form form={form} layout="vertical" initialValues={{ status: 'NOMINATED' }}>
          <Form.Item name="fuelGradeId" label="Fuel Grade" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={fuelGrades.map((f) => ({ value: f.fuelGradeId, label: f.gradeCode }))} />
          </Form.Item>
          <Form.Item name="quantityMt" label="Quantity (MT)" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="pricePerMt" label="Price per MT"><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="robBeforeMt" label="ROB Before (MT)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="robAfterMt" label="ROB After (MT)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="portLocationId" label="Port"><Select allowClear showSearch optionFilterProp="label"
            options={locations.map((l) => ({ value: l.locationId, label: l.locationName }))} /></Form.Item>
          <Form.Item name="stemDate" label="Stem Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={BUNKER_STEM_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function SofEventsTab({ voyageId }: { voyageId: number }) {
  const { data = [], isLoading } = useSofEvents(voyageId);
  const save = useSaveSofEvent();
  const { data: eventTypes = [] } = useTableRows<{ sofEventTypeId: number; eventCode: string }>('sof_event_type');
  const { data: locations = [] } = useLocations();
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<VoyageSofEventInput>();

  async function submit() {
    const v = await form.validateFields();
    const input: VoyageSofEventInput = {
      ...v,
      voyageId,
      eventTimestamp: dayjs(v.eventTimestamp as unknown as dayjs.Dayjs).toISOString(),
      isManualEntry: true,
    };
    await save.mutateAsync({ id: null, input });
    setOpen(false);
    form.resetFields();
  }

  return (
    <div>
      <Button icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Log SOF Event</Button>
      <Table
        rowKey="sofEventId"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'Port', dataIndex: 'portLocationName', render: (v) => v ?? '—' },
          { title: 'Call #', dataIndex: 'portCallSequence' },
          { title: 'Event', dataIndex: 'eventCode', render: (v) => v ?? '—' },
          { title: 'Timestamp', dataIndex: 'eventTimestamp', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          { title: 'Remarks', dataIndex: 'remarks', render: (v) => v ?? '—' },
        ]}
      />
      <Modal title="Log SOF Event" open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} confirmLoading={save.isPending}>
        <Form form={form} layout="vertical" initialValues={{ portCallSequence: 1 }}>
          <Form.Item name="portLocationId" label="Port" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={locations.map((l) => ({ value: l.locationId, label: l.locationName }))} />
          </Form.Item>
          <Form.Item name="portCallSequence" label="Port Call #" rules={[{ required: true }]}><InputNumber style={{ width: '100%' }} min={1} /></Form.Item>
          <Form.Item name="sofEventTypeId" label="Event Type" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={eventTypes.map((t) => ({ value: t.sofEventTypeId, label: t.eventCode }))} />
          </Form.Item>
          <Form.Item name="eventTimestamp" label="Timestamp" rules={[{ required: true }]}><DatePicker showTime style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function LaytimeTab({ voyageId }: { voyageId: number }) {
  const { data = [], isLoading } = useLaytimeCalculations(voyageId);
  const create = useCreateLaytimeCalculation();
  const { data: locations = [] } = useLocations();
  const { data: laytimeTerms = [] } = useTableRows<{ laytimeTermId: number; termCode: string }>('laytime_term_template');
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm<LaytimeCalculationInput>();

  async function submit() {
    const v = await form.validateFields();
    await create.mutateAsync({ ...v, voyageId });
    setOpen(false);
    form.resetFields();
  }

  return (
    <div>
      <Button icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ marginBottom: 12 }}>Record Laytime Calculation</Button>
      <Table
        rowKey="laytimeCalculationId"
        loading={isLoading}
        dataSource={data}
        pagination={false}
        columns={[
          { title: 'Port', dataIndex: 'portLocationName', render: (v) => v ?? '—' },
          { title: 'Version', dataIndex: 'versionNumber', render: (v: number, r: { isCurrentVersion: boolean }) => <Tag color={r.isCurrentVersion ? 'processing' : 'default'}>v{v}{r.isCurrentVersion ? ' (current)' : ''}</Tag> },
          { title: 'Allowed (hrs)', dataIndex: 'allowedLaytimeHours', render: (v) => v ?? '—' },
          { title: 'Used (hrs)', dataIndex: 'usedLaytimeHours', render: (v) => v ?? '—' },
          { title: 'Demurrage (hrs)', dataIndex: 'demurrageHours', render: (v) => v ?? '—' },
          { title: 'Despatch (hrs)', dataIndex: 'despatchHours', render: (v) => v ?? '—' },
          { title: 'Demurrage Amt', dataIndex: 'demurrageAmount', render: (v) => v ?? '—' },
          { title: 'Despatch Amt', dataIndex: 'despatchAmount', render: (v) => v ?? '—' },
        ]}
      />
      <Modal title="Record Laytime Calculation (new version)" open={open} onCancel={() => setOpen(false)} onOk={() => void submit()} confirmLoading={create.isPending}>
        <Form form={form} layout="vertical">
          <Form.Item name="portLocationId" label="Port" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={locations.map((l) => ({ value: l.locationId, label: l.locationName }))} />
          </Form.Item>
          <Form.Item name="laytimeTermId" label="Laytime Term"><Select allowClear showSearch optionFilterProp="label"
            options={laytimeTerms.map((t) => ({ value: t.laytimeTermId, label: t.termCode }))} /></Form.Item>
          <Form.Item name="allowedLaytimeHours" label="Allowed Laytime (hrs)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="usedLaytimeHours" label="Used Laytime (hrs)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="demurrageHours" label="Demurrage (hrs)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="despatchHours" label="Despatch (hrs)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="demurrageAmount" label="Demurrage Amount"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="despatchAmount" label="Despatch Amount"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
