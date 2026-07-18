import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';
import dayjs, { type Dayjs } from 'dayjs';
import { useLocations } from '@features/logistics/locations/hooks';
import { useTanks } from '@features/logistics/tanks/hooks';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { useNominations, useTradeOrderOptions } from '@features/operations/nominations/hooks';
import { useDeliveryInstructions, useSaveDeliveryInstruction } from './hooks';
import {
  DELIVERY_INSTRUCTION_TYPES, DELIVERY_INSTRUCTION_STATUSES,
  type DeliveryInstruction, type DeliveryInstructionInput, type DeliveryInstructionStatus,
} from './types';
import { useUom } from '@features/reference/uom/hooks';

const STATUS_COLOR: Record<DeliveryInstructionStatus, string> = {
  DRAFT: 'default', ISSUED: 'processing', ACKNOWLEDGED: 'blue', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'default',
};

export function DeliveryInstructionsPage() {
  const { data = [], isLoading, refetch } = useDeliveryInstructions();
  const save = useSaveDeliveryInstruction();
  const { data: orderOptions = [] } = useTradeOrderOptions();
  const { data: nominations = [] } = useNominations();
  const { data: locations = [] } = useLocations();
  const { data: tanks = [] } = useTanks();
  const { data: counterparties = [] } = useCounterparties();
  const { data: uoms = [] } = useUom();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryInstruction | null>(null);
  const [form] = Form.useForm<DeliveryInstructionInput>();
  useFormDraft('delivery-instruction', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ instructionType: 'LOADING', status: 'DRAFT' } as unknown as DeliveryInstructionInput);
    setOpen(true);
  }

  function openEdit(r: DeliveryInstruction) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      scheduledDate: r.scheduledDate ? dayjs(r.scheduledDate) : undefined,
      actualDate: r.actualDate ? dayjs(r.actualDate) : undefined,
      issuedAt: r.issuedAt ? dayjs(r.issuedAt) : undefined,
      acknowledgedAt: r.acknowledgedAt ? dayjs(r.acknowledgedAt) : undefined,
    } as unknown as DeliveryInstructionInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: DeliveryInstructionInput = {
      ...values,
      scheduledDate: v.scheduledDate ? v.scheduledDate.format('YYYY-MM-DD') : (values.scheduledDate as unknown as string),
      actualDate: v.actualDate ? v.actualDate.format('YYYY-MM-DD') : null,
      issuedAt: v.issuedAt ? v.issuedAt.toISOString() : null,
      acknowledgedAt: v.acknowledgedAt ? v.acknowledgedAt.toISOString() : null,
    };
    const saved = await save.mutateAsync({ id: editing?.deliveryInstructionId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const orderOpts = useMemo(
    () => orderOptions.map((o) => ({ value: o.orderId, label: o.orderReference })),
    [orderOptions],
  );
  const nominationOpts = useMemo(
    () => nominations.map((n) => ({ value: n.nominationId, label: n.nominationReference })),
    [nominations],
  );
  const locationOpts = useMemo(
    () => locations.map((l) => ({ value: l.locationId, label: `${l.locationCode} — ${l.locationName}` })),
    [locations],
  );
  const uomOpts = useMemo(() => uoms.map((u) => ({ value: u.uomId, label: u.uomCode })), [uoms]);
  const tankOpts = useMemo(
    () => tanks.map((t) => ({ value: t.tankId, label: `${t.tankNumber} — ${t.facilityName}` })),
    [tanks],
  );
  const counterpartyOpts = useMemo(
    () => counterparties.map((c) => ({ value: c.counterpartyId, label: `${c.cpCode} — ${c.shortName}` })),
    [counterparties],
  );

  const colDefs = useMemo<ColDef<DeliveryInstruction>[]>(() => [
    { field: 'instructionReference', headerName: 'Instruction Ref', width: 170, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'orderReference', headerName: 'Order', width: 170, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'nominationReference', headerName: 'Nomination', width: 150, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'instructionType', headerName: 'Type', width: 105, cellRenderer: (p: { value: string }) => <Tag>{p.value}</Tag> },
    {
      field: 'status', headerName: 'Status', width: 125,
      cellRenderer: (p: { value: DeliveryInstructionStatus }) => <Tag color={STATUS_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      headerName: 'Qty / UoM', width: 140,
      valueGetter: (p) => `${Number(p.data?.quantity ?? 0).toLocaleString()} ${p.data?.uomCode ?? ''}`,
      cellStyle: { fontFamily: 'monospace', fontSize: 11 },
    },
    { field: 'locationName', headerName: 'Location', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'tankNumber', headerName: 'Tank', width: 100, valueFormatter: (p) => p.value ?? '—' },
    { field: 'berth', headerName: 'Berth', width: 90, valueFormatter: (p) => p.value ?? '—' },
    { field: 'terminalAgentCounterpartyName', headerName: 'Terminal Agent', flex: 1, minWidth: 150, valueFormatter: (p) => p.value ?? '—' },
    { field: 'scheduledDate', headerName: 'Scheduled', width: 110, cellClass: 'cell-mono' },
    { field: 'actualDate', headerName: 'Actual', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: DeliveryInstruction }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Delivery Instructions"
        description="Formal instructions to load, discharge, deliver, or receive against a trade order leg — the executed instruction telling a counterparty, terminal, or agent exactly what to move, where, and when. Distinct from a nomination, which only requests/reserves a slot."
        moduleGroup="trade"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Delivery Instruction"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.deliveryInstructionId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Delivery Instruction — ${editing.instructionReference}` : 'New Delivery Instruction'}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" size="small">
          <Form.Item name="orderId" label="Order" rules={[{ required: true }]}>
            <Select options={orderOpts} showSearch optionFilterProp="label" placeholder="Select trade order leg" />
          </Form.Item>
          <Form.Item name="nominationId" label={hint('Nomination', 'Optional: the nomination this instruction formalizes. Not every delivery instruction originates from a nomination — e.g. spot cargo lifted without a prior slot reservation.')}>
            <Select options={nominationOpts} showSearch optionFilterProp="label" allowClear placeholder="None" />
          </Form.Item>
          <Form.Item name="instructionReference" label="Instruction Reference" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} placeholder="DI-2026-00001" />
          </Form.Item>
          <Form.Item name="instructionType" label="Instruction Type" rules={[{ required: true }]}>
            <Select options={DELIVERY_INSTRUCTION_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={DELIVERY_INSTRUCTION_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="quantity" label="Quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="50000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
          </Form.Item>
          <Form.Item name="uomId" label="UoM" rules={[{ required: true }]}>
            <Select options={uomOpts} showSearch optionFilterProp="label" placeholder="BBL" />
          </Form.Item>
          <Form.Item name="locationId" label="Location">
            <Select options={locationOpts} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="tankId" label="Tank">
            <Select options={tankOpts} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="berth" label="Berth">
            <Input placeholder="Berth 4" />
          </Form.Item>
          <Form.Item name="terminalAgentCounterpartyId" label={hint('Terminal Agent', 'Shipping or terminal agent executing the instruction on the ground.')}>
            <Select options={counterpartyOpts} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="scheduledDate" label="Scheduled Date" rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="actualDate" label="Actual Date">
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="issuedAt" label="Issued At">
            <AppDatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="acknowledgedAt" label="Acknowledged At">
            <AppDatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} updatedAt={editing?.updatedAt} />
      </Drawer>
    </>
  );
}
