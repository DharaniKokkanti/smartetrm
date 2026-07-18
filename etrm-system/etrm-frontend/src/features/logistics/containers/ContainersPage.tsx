import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';
import dayjs, { type Dayjs } from 'dayjs';
import { useTableRows } from '@features/tier2/hooks';
import { useContainers, useSaveContainer, useDeactivateContainer } from './hooks';
import { CONTAINER_TYPES, type Container, type ContainerInput } from './types';

export function ContainersPage() {
  const { data = [], isLoading, refetch } = useContainers();
  const save = useSaveContainer();
  const deactivate = useDeactivateContainer();
  const { data: operatorRows = [] } = useTableRows<{ operatorId: number; operatorCode: string; operatorName: string }>('transport_operator');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Container | null>(null);
  const [form] = Form.useForm<ContainerInput>();
  useFormDraft('containers', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ containerType: 'ISO_TANK', isActive: true } as unknown as ContainerInput);
    setOpen(true);
  }

  function openEdit(r: Container) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      cscPlateExpiry: r.cscPlateExpiry ? dayjs(r.cscPlateExpiry) : undefined,
      lastInspectionDate: r.lastInspectionDate ? dayjs(r.lastInspectionDate) : undefined,
      nextInspectionDate: r.nextInspectionDate ? dayjs(r.nextInspectionDate) : undefined,
    } as unknown as ContainerInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: ContainerInput = {
      ...values,
      cscPlateExpiry: v.cscPlateExpiry ? v.cscPlateExpiry.format('YYYY-MM-DD') : null,
      lastInspectionDate: v.lastInspectionDate ? v.lastInspectionDate.format('YYYY-MM-DD') : null,
      nextInspectionDate: v.nextInspectionDate ? v.nextInspectionDate.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.containerId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const operatorOpts = useMemo(
    () => operatorRows.map((o) => ({ value: o.operatorId, label: `${o.operatorCode} — ${o.operatorName}` })),
    [operatorRows],
  );

  const colDefs = useMemo<ColDef<Container>[]>(() => [
    { field: 'containerNumber', headerName: 'Container #', width: 150, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'containerType', headerName: 'Type', width: 110, cellRenderer: (p: { value: string }) => <Tag style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'operatorName', headerName: 'Operator', flex: 1, minWidth: 150 },
    { field: 'capacityLitres', headerName: 'Capacity (L)', width: 120, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'unApproval', headerName: 'UN Approval', width: 110, valueFormatter: (p) => p.value ?? '—' },
    { field: 'cscPlateExpiry', headerName: 'CSC Expiry', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Container }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this container?" onConfirm={() => deactivate.mutate(p.data.containerId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Containers"
        description="ISO tank containers and flexibags for bulk liquids and packaged goods — container number, type, operator, and hazmat/safety certification."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Container"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.containerId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Container — ${editing.containerNumber}` : 'New Container'}
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
          <Form.Item name="containerNumber" label={hint('Container Number', 'ISO 6346 container identifier.', 'TTNU1234567')} rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="containerType" label="Container Type" rules={[{ required: true }]}>
            <Select options={CONTAINER_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="operatorId" label="Operator" rules={[{ required: true }]}>
            <Select options={operatorOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="capacityLitres" label="Capacity (L)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="capacityMt" label="Capacity (MT)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="tareWeightKg" label="Tare Weight (kg)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="maxGrossWeightKg" label="Max Gross Weight (kg)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="unApproval" label={hint('UN Approval', 'UN portable tank instruction for hazmat cargo.', 'T11')}>
            <Input />
          </Form.Item>
          <Form.Item name="approvedCommodities" label="Approved Commodities">
            <Input placeholder="CSV of commodity codes" />
          </Form.Item>
          <Form.Item name="cscPlateExpiry" label={hint('CSC Plate Expiry', 'Container Safety Convention plate expiry date.')}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="lastInspectionDate" label="Last Inspection">
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="nextInspectionDate" label="Next Inspection">
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
