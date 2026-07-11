import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { usePipelines } from '@features/trade/hooks';
import { usePipelineSegments, useSavePipelineSegment, useDeactivatePipelineSegment } from './hooks';
import { OPERATIONAL_STATUSES, type PipelineSegment, type PipelineSegmentInput } from './types';

const STATUS_COLOR: Record<string, string> = {
  IN_SERVICE: 'success', REDUCED_CAPACITY: 'warning', MAINTENANCE: 'blue', OUTAGE: 'error', DECOMMISSIONED: 'default',
};

export function PipelineSegmentsPage() {
  const { data = [], isLoading, refetch } = usePipelineSegments();
  const save = useSavePipelineSegment();
  const deactivate = useDeactivatePipelineSegment();
  const { data: pipelines = [] } = usePipelines();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineSegment | null>(null);
  const [form] = Form.useForm<PipelineSegmentInput>();
  useFormDraft('pipeline-segments', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ operationalStatus: 'IN_SERVICE', isActive: true } as unknown as PipelineSegmentInput);
    setOpen(true);
  }

  function openEdit(r: PipelineSegment) {
    setEditing(r);
    form.setFieldsValue(r as unknown as PipelineSegmentInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.segmentId ?? null, input: values });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const pipelineOpts = useMemo(
    () => (pipelines as { pipelineId: number; pipelineCode: string; pipelineName: string }[])
      .map((p) => ({ value: p.pipelineId, label: `${p.pipelineCode} — ${p.pipelineName}` })),
    [pipelines],
  );

  const colDefs = useMemo<ColDef<PipelineSegment>[]>(() => [
    { field: 'segmentCode', headerName: 'Segment Code', width: 140, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'pipelineName', headerName: 'Pipeline', flex: 1, minWidth: 150 },
    { field: 'fromPointCode', headerName: 'From', width: 110, cellClass: 'cell-mono' },
    { field: 'toPointCode', headerName: 'To', width: 110, cellClass: 'cell-mono' },
    { field: 'lengthKm', headerName: 'Length (km)', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'forwardCapacity', headerName: 'Fwd Capacity', width: 120, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'operationalStatus', headerName: 'Status', width: 130,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PipelineSegment }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this segment?" onConfirm={() => deactivate.mutate(p.data.segmentId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Pipeline Segments"
        description="Individual pipeline segments with injection/offtake points, physical characteristics, and directional capacity."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Segment"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.segmentId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Segment — ${editing.segmentCode}` : 'New Pipeline Segment'}
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
          <Form.Item name="pipelineId" label="Pipeline" rules={[{ required: true }]}>
            <Select options={pipelineOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="segmentCode" label="Segment Code" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="segmentName" label="Segment Name">
            <Input />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="fromPointCode" label={hint('From Point', 'Injection/entry point code for this segment.')} style={{ width: '50%' }} rules={[{ required: true }]}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="toPointCode" label="To Point" style={{ width: '50%' }} rules={[{ required: true }]}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="lengthKm" label="Length (km)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="diameterMm" label="Diameter (mm)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="maxOperatingPressure" label="Max Operating Pressure (bar-g)">
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="forwardCapacity" label="Forward Capacity" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="reverseCapacity" label={hint('Reverse Capacity', 'Leave blank if this segment is unidirectional.')} style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="tariffZone" label={hint('Tariff Zone', 'Pricing zone used to look up the applicable transport tariff for this segment.')}>
            <Input />
          </Form.Item>
          <Form.Item name="operationalStatus" label="Operational Status" rules={[{ required: true }]}>
            <Select options={OPERATIONAL_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
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
