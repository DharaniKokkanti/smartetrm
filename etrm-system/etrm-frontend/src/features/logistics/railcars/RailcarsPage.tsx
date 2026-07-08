import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch, Table, Typography } from 'antd';
import { EditOutlined, StopOutlined, CheckSquareOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useFormDraft } from '@components/smart/formDraft';
import dayjs, { type Dayjs } from 'dayjs';
import { useTableRows } from '@features/tier2/hooks';
import { useCountries } from '@features/reference/countries/hooks';
import {
  useRailcars, useSaveRailcar, useDeactivateRailcar,
  useRailcarApprovedProducts, useSaveRailcarApprovedProduct, useDeleteRailcarApprovedProduct,
} from './hooks';
import {
  RAILCAR_TYPES, ASSET_APPROVAL_STATUSES, type Railcar, type RailcarInput,
  type RailcarProductApproval, type RailcarProductApprovalInput,
} from './types';

const STATUS_COLOR: Record<string, string> = {
  APPROVED: 'success', CONDITIONAL: 'warning', SUSPENDED: 'error', REJECTED: 'default',
};

function ApprovedProductsDrawer({ railcar, onClose }: { railcar: Railcar; onClose: () => void }) {
  const railcarId = railcar.railcarId;
  const { data = [], isLoading } = useRailcarApprovedProducts(railcarId);
  const save = useSaveRailcarApprovedProduct(railcarId);
  const remove = useDeleteRailcarApprovedProduct(railcarId);
  const { data: productRows = [] } = useTableRows('product');
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm<{ productId: number; approvalStatus: string; effectiveFrom: Dayjs; effectiveTo?: Dayjs; regulatoryRef?: string; conditions?: string }>();

  const productOpts = useMemo(
    () => (productRows as unknown as { productId: number; productCode: string; productName: string }[])
      .map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` })),
    [productRows],
  );

  async function handleAdd() {
    const v = await form.validateFields();
    const input: RailcarProductApprovalInput = {
      assetId: railcarId,
      productId: v.productId,
      maxQuantity: null,
      quantityUomId: null,
      approvalStatus: v.approvalStatus as RailcarProductApproval['approvalStatus'],
      conditions: v.conditions ?? null,
      regulatoryRef: v.regulatoryRef ?? null,
      effectiveFrom: v.effectiveFrom.format('YYYY-MM-DD'),
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
      isActive: true,
      approvedBy: null,
      notes: null,
    };
    await save.mutateAsync(input);
    form.resetFields();
    setAddOpen(false);
  }

  return (
    <Drawer mask={false} forceRender title={`Approved Products — ${railcar.carNumber}`} open onClose={onClose} width={520}
      extra={<Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Product</Button>}
    >
      <Table<RailcarProductApproval> dataSource={data} rowKey="assetApprovalId" pagination={false} size="small" loading={isLoading}
        columns={[
          { title: 'Product', dataIndex: 'productName' },
          { title: 'Status', dataIndex: 'approvalStatus', width: 110, render: (v: string) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
          { title: 'Effective', dataIndex: 'effectiveFrom', width: 100 },
          {
            title: '', width: 50, render: (_: unknown, r: RailcarProductApproval) => (
              <Popconfirm title="Remove this product approval?" onConfirm={() => remove.mutate(r.assetApprovalId)} okText="Remove" okButtonProps={{ danger: true }}>
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
              </Popconfirm>
            ),
          },
        ]} />
      {data.length === 0 && !isLoading && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          No products approved for this car yet — add one to record what it's cleared to carry.
        </Typography.Text>
      )}

      <Drawer mask={false} title="Add Product Approval" open={addOpen} onClose={() => setAddOpen(false)} width={400}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setAddOpen(false)}>Cancel</Button><Button type="primary" onClick={() => { void handleAdd(); }} loading={save.isPending}>Add</Button></Space>}
      >
        <Form form={form} layout="vertical" initialValues={{ approvalStatus: 'APPROVED', effectiveFrom: dayjs() }}>
          <Form.Item name="productId" label="Product" rules={[{ required: true }]}>
            <Select options={productOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="approvalStatus" label="Approval Status" rules={[{ required: true }]}>
            <Select options={ASSET_APPROVAL_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="effectiveFrom" label="Effective From" style={{ width: '50%' }} rules={[{ required: true }]}>
              <AppDatePicker style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="effectiveTo" label="Effective To" style={{ width: '50%' }}>
              <AppDatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="regulatoryRef" label="Regulatory Reference">
            <Input placeholder="49 CFR 173.xxx" />
          </Form.Item>
          <Form.Item name="conditions" label="Conditions">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </Drawer>
  );
}

export function RailcarsPage() {
  const { data = [], isLoading, refetch } = useRailcars();
  const save = useSaveRailcar();
  const deactivate = useDeactivateRailcar();
  const { data: operatorRows = [] } = useTableRows('transport_operator');
  const { data: countries = [] } = useCountries();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Railcar | null>(null);
  const [viewingApprovals, setViewingApprovals] = useState<Railcar | null>(null);
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
  const countryOpts = useMemo(
    () => countries.map((c) => ({ value: c.countryCode, label: `${c.countryCode} — ${c.countryName}` })),
    [countries],
  );

  const colDefs = useMemo<ColDef<Railcar>[]>(() => [
    { field: 'carNumber', headerName: 'Car Number', width: 150, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'carType', headerName: 'Type', width: 130, cellRenderer: (p: { value: string }) => <Tag style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'operatorName', headerName: 'Operator', flex: 1, minWidth: 150 },
    { field: 'capacityMt', headerName: 'Capacity (MT)', width: 120, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'grossRailLoadLbs', headerName: 'GRL (lbs)', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ? p.value.toLocaleString() : '—',
      tooltipValueGetter: () => 'AAR/FRA Gross Rail Load weight class — 263,000 / 286,000 / 315,000 lbs. Determines which track/line this car can run on.' },
    { field: 'dotClass', headerName: 'DOT Class', width: 100, valueFormatter: (p) => p.value ?? '—' },
    { field: 'buildYear', headerName: 'Built', width: 80, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'homeRailroad', headerName: 'Home Railroad', flex: 1, minWidth: 130, valueFormatter: (p) => p.value ?? '—' },
    { field: 'countryName', headerName: 'Country', width: 130, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 110, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Railcar }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<CheckSquareOutlined />} onClick={() => setViewingApprovals(p.data)} title="Approved products" />
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
        description="Tank cars and bulk railcars — AAR/DOT designation, capacity, weight class, home railroad, and inspection/test dates. Approved products tracked separately per car."
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

      {viewingApprovals != null && <ApprovedProductsDrawer railcar={viewingApprovals} onClose={() => setViewingApprovals(null)} />}

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
          <Space.Compact block>
            <Form.Item name="buildYear" label="Build Year" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={1900} max={2100} precision={0} />
            </Form.Item>
            <Form.Item name="grossRailLoadLbs" label="Gross Rail Load (lbs)" style={{ width: '50%' }}>
              <InputNumber style={{ width: '100%' }} min={0} step={1000} placeholder="286000" />
            </Form.Item>
          </Space.Compact>
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
          <Form.Item name="countryCode" label="Country" rules={[{ required: true }]}>
            <Select options={countryOpts} showSearch optionFilterProp="label" />
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
