import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useFormDraft } from '@components/smart/formDraft';
import dayjs, { type Dayjs } from 'dayjs';
import { useTableRows } from '@features/tier2/hooks';
import { useRailcars, useSaveRailcar, useDeactivateRailcar } from './hooks';
import { RAILCAR_TYPES, type Railcar, type RailcarInput } from './types';

export function RailcarsPage() {
  const { data = [], isLoading, refetch } = useRailcars();
  const save = useSaveRailcar();
  const deactivate = useDeactivateRailcar();
  const { data: operatorRows = [] } = useTableRows('transport_operator');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Railcar | null>(null);
  const [form] = Form.useForm<RailcarInput>();
  useFormDraft('railcars', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ carType: 'TANK_CAR', countryCode: 'US', isActive: true } as unknown as RailcarInput);
    setOpen(true);
  }

  function openEdit(r: Railcar) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      lastTestDate: r.lastTestDate ? dayjs(r.lastTestDate) : undefined,
      nextTestDate: r.nextTestDate ? dayjs(r.nextTestDate) : undefined,
      certExpiry: r.certExpiry ? dayjs(r.certExpiry) : undefined,
    } as unknown as RailcarInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: RailcarInput = {
      ...values,
      lastTestDate: v.lastTestDate ? v.lastTestDate.format('YYYY-MM-DD') : null,
      nextTestDate: v.nextTestDate ? v.nextTestDate.format('YYYY-MM-DD') : null,
      certExpiry: v.certExpiry ? v.certExpiry.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.railcarId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const operatorOpts = useMemo(
    () => (operatorRows as unknown as { operatorId: number; operatorCode: string; operatorName: string }[])
      .map((o) => ({ value: o.operatorId, label: `${o.operatorCode} — ${o.operatorName}` })),
    [operatorRows],
  );

  const colDefs = useMemo<ColDef<Railcar>[]>(() => [
    { field: 'carNumber', headerName: 'Car Number', width: 150, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'carType', headerName: 'Type', width: 130, cellRenderer: (p: { value: string }) => <Tag style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'operatorName', headerName: 'Operator', flex: 1, minWidth: 150 },
    { field: 'capacityMt', headerName: 'Capacity (MT)', width: 120, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'dotClass', headerName: 'DOT Class', width: 100, valueFormatter: (p) => p.value ?? '—' },
    { field: 'homeRailroad', headerName: 'Home Railroad', flex: 1, minWidth: 130, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Railcar }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this railcar?" onConfirm={() => deactivate.mutate(p.data.railcarId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Rail Cars"
        description="Tank cars and bulk railcars — AAR/DOT designation, capacity, home railroad, lessee, and inspection/test dates."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Railcar"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.railcarId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Railcar — ${editing.carNumber}` : 'New Railcar'}
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
          <Form.Item name="carNumber" label="Car Number" rules={[{ required: true }]}>
            <Input placeholder="TILX 123456" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="carType" label="Car Type" rules={[{ required: true }]}>
            <Select options={RAILCAR_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
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
            <Form.Item name="dotClass" label="DOT Class" style={{ width: '50%' }}>
              <Input placeholder="DOT-117" />
            </Form.Item>
            <Form.Item name="aarClass" label="AAR Class" style={{ width: '50%' }}>
              <Input />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="approvedCommodities" label="Approved Commodities">
            <Input placeholder="CSV of commodity codes" />
          </Form.Item>
          <Form.Item name="lastTestDate" label="Last Test Date">
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="nextTestDate" label="Next Test Date">
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="certExpiry" label="Certificate Expiry">
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="homeRailroad" label="Home Railroad">
            <Input />
          </Form.Item>
          <Form.Item name="countryCode" label="Country (ISO 2)" rules={[{ required: true }, { len: 2 }]}>
            <Input maxLength={2} style={{ textTransform: 'uppercase' }} />
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
