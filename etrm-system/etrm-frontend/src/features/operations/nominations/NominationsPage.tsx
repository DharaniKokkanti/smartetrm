import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import dayjs, { type Dayjs } from 'dayjs';
import { useLocations } from '@features/logistics/locations/hooks';
import { usePipelines } from '@features/logistics/pipelines/hooks';
import { useVessels } from '@features/logistics/vessels/hooks';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { useSystemUsers } from '@features/admin/system-users/hooks';
import { useNominations, useSaveNomination, useTradeOrderOptions } from './hooks';
import { NOMINATION_TYPES, NOMINATION_STATUSES, type Nomination, type NominationInput, type NominationStatus } from './types';
import { useUom } from '@features/reference/uom/hooks';

const STATUS_COLOR: Record<NominationStatus, string> = {
  DRAFT: 'default', SUBMITTED: 'processing', ACCEPTED: 'success', REJECTED: 'error',
  AMENDED: 'warning', CANCELLED: 'default', COMPLETED: 'blue',
};

export function NominationsPage() {
  const { data = [], isLoading, refetch } = useNominations();
  const save = useSaveNomination();
  const { data: orderOptions = [] } = useTradeOrderOptions();
  const { data: locations = [] } = useLocations();
  const { data: pipelines = [] } = usePipelines();
  const { data: vessels = [] } = useVessels();
  const { data: counterparties = [] } = useCounterparties();
  const { data: users = [] } = useSystemUsers();
  const { data: uoms = [] } = useUom();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Nomination | null>(null);
  const [form] = Form.useForm<NominationInput>();
  useFormDraft('nomination', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ nominationType: 'PIPELINE', status: 'DRAFT' } as unknown as NominationInput);
    setOpen(true);
  }

  function openEdit(r: Nomination) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      nominationWindowStart: r.nominationWindowStart ? dayjs(r.nominationWindowStart) : undefined,
      nominationWindowEnd: r.nominationWindowEnd ? dayjs(r.nominationWindowEnd) : undefined,
      deadlineDatetime: r.deadlineDatetime ? dayjs(r.deadlineDatetime) : undefined,
      submittedAt: r.submittedAt ? dayjs(r.submittedAt) : undefined,
      acceptedAt: r.acceptedAt ? dayjs(r.acceptedAt) : undefined,
    } as unknown as NominationInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: NominationInput = {
      ...values,
      nominationWindowStart: v.nominationWindowStart ? v.nominationWindowStart.format('YYYY-MM-DD') : (values.nominationWindowStart as unknown as string),
      nominationWindowEnd: v.nominationWindowEnd ? v.nominationWindowEnd.format('YYYY-MM-DD') : (values.nominationWindowEnd as unknown as string),
      deadlineDatetime: v.deadlineDatetime ? v.deadlineDatetime.toISOString() : null,
      submittedAt: v.submittedAt ? v.submittedAt.toISOString() : null,
      acceptedAt: v.acceptedAt ? v.acceptedAt.toISOString() : null,
    };
    const saved = await save.mutateAsync({ id: editing?.nominationId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const orderOpts = useMemo(
    () => orderOptions.map((o) => ({ value: o.orderId, label: o.orderReference })),
    [orderOptions],
  );
  const locationOpts = useMemo(
    () => locations.map((l) => ({ value: l.locationId, label: `${l.locationCode} — ${l.locationName}` })),
    [locations],
  );
  const uomOpts = useMemo(() => uoms.map((u) => ({ value: u.uomId, label: u.uomCode })), [uoms]);
  const pipelineOpts = useMemo(
    () => pipelines.map((p) => ({ value: p.pipelineCode, label: `${p.pipelineCode} — ${p.pipelineName}` })),
    [pipelines],
  );
  const vesselOpts = useMemo(
    () => vessels.map((v) => ({ value: v.vesselId, label: v.vesselName })),
    [vessels],
  );
  const counterpartyOpts = useMemo(
    () => counterparties.map((c) => ({ value: c.counterpartyId, label: `${c.cpCode} — ${c.shortName}` })),
    [counterparties],
  );
  const userOpts = useMemo(
    () => users.map((u) => ({ value: u.userId, label: u.fullName })),
    [users],
  );

  const colDefs = useMemo<ColDef<Nomination>[]>(() => [
    { field: 'nominationReference', headerName: 'Nomination Ref', width: 170, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'orderReference', headerName: 'Order', width: 170, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'nominationType', headerName: 'Type', width: 105, cellRenderer: (p: { value: string }) => <Tag>{p.value}</Tag> },
    {
      field: 'status', headerName: 'Status', width: 115,
      cellRenderer: (p: { value: NominationStatus }) => <Tag color={STATUS_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      headerName: 'Qty / UoM', width: 140,
      valueGetter: (p) => `${Number(p.data?.nominatedQuantity ?? 0).toLocaleString()} ${p.data?.uomCode ?? ''}`,
      cellStyle: { fontFamily: 'monospace', fontSize: 11 },
    },
    { field: 'nominationWindowStart', headerName: 'Window Start', width: 115, cellClass: 'cell-mono' },
    { field: 'nominationWindowEnd', headerName: 'Window End', width: 115, cellClass: 'cell-mono' },
    { field: 'locationName', headerName: 'Location', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'pipelineName', headerName: 'Pipeline', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'vesselName', headerName: 'Vessel', width: 130, valueFormatter: (p) => p.value ?? '—' },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 150, valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Nomination }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Nominations"
        description="Physical scheduling nominations against trade order legs — pipeline batches, vessel loading/discharge windows, terminal slots, rail/truck liftings. A term order may carry several nominations, one per delivery period."
        moduleGroup="trade"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Nomination"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.nominationId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Nomination — ${editing.nominationReference}` : 'New Nomination'}
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
          <Form.Item name="nominationReference" label="Nomination Reference" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} placeholder="NOM-2026-00001" />
          </Form.Item>
          <Form.Item name="nominationType" label={hint('Nomination Type', 'Mode of physical scheduling — PIPELINE batch, VESSEL loading/discharge window, TERMINAL slot, RAIL/TRUCK lifting, or STORAGE movement.')} rules={[{ required: true }]}>
            <Select options={NOMINATION_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={NOMINATION_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="nominatedQuantity" label="Nominated Quantity" rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="50000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(v) => v?.replace(/,/g, '') as unknown as number} />
          </Form.Item>
          <Form.Item name="uomId" label="UoM" rules={[{ required: true }]}>
            <Select options={uomOpts} showSearch optionFilterProp="label" placeholder="BBL" />
          </Form.Item>
          <Form.Item name="nominationWindowStart" label="Window Start" rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="nominationWindowEnd"
            dependencies={['nominationWindowStart']}
            label="Window End"
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('nominationWindowStart');
                  if (!value || !start || !value.isBefore(start)) return Promise.resolve();
                  return Promise.reject(new Error('Window end must be on or after the window start'));
                },
              }),
            ]}
          >
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="deadlineDatetime" label={hint('Deadline', 'Nomination cutoff per pipeline/terminal rules — after this the slot may be forfeited.')}>
            <AppDatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="locationId" label="Location">
            <Select options={locationOpts} showSearch optionFilterProp="label" allowClear placeholder="Terminal / pipeline point" />
          </Form.Item>
          <Form.Item name="pipelineCode" label="Pipeline">
            <Select options={pipelineOpts} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="vesselId" label="Vessel">
            <Select options={vesselOpts} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="counterpartyId" label={hint('Counterparty', 'The party nominated to/from — the receiving or delivering counterparty for this slot.')}>
            <Select options={counterpartyOpts} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="submittedByUserId" label="Submitted By">
            <Select options={userOpts} showSearch optionFilterProp="label" allowClear />
          </Form.Item>
          <Form.Item name="submittedAt" label="Submitted At">
            <AppDatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="acceptedAt" label="Accepted At">
            <AppDatePicker showTime format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="rejectionReason" label="Rejection Reason">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
