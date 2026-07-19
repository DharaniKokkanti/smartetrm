import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, InputNumber } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';
import dayjs, { type Dayjs } from 'dayjs';
import { useCounterparties } from '@features/trade/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useCollateral, useSaveCollateral } from './hooks';
import { COLLATERAL_DIRECTIONS, SECURED_ENTITY_TYPES, COLLATERAL_STATUSES, type Collateral, type CollateralInput } from './types';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success', RETURNED: 'default', CALLED: 'volcano', DEFAULTED: 'error', SUBSTITUTED: 'blue',
};

export function CollateralPage() {
  const { data = [], isLoading, refetch } = useCollateral();
  const save = useSaveCollateral();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: currencies = [] } = useCurrencies();
  const { data: collateralTypeRows = [] } = useTableRows<{ collateralTypeId: number; typeCode: string; typeName: string }>('collateral_type');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Collateral | null>(null);
  const [form] = Form.useForm<CollateralInput>();
  useFormDraft('collateral', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ direction: 'RECEIVED', securedEntityType: 'COUNTERPARTY', status: 'ACTIVE', haircutPct: 0 } as unknown as CollateralInput);
    setOpen(true);
  }

  function openEdit(r: Collateral) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      postingDate: r.postingDate ? dayjs(r.postingDate) : undefined,
      maturityDate: r.maturityDate ? dayjs(r.maturityDate) : undefined,
    } as unknown as CollateralInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: CollateralInput = {
      ...values,
      postingDate: v.postingDate ? v.postingDate.format('YYYY-MM-DD') : values.postingDate,
      maturityDate: v.maturityDate ? v.maturityDate.format('YYYY-MM-DD') : null,
      returnDate: null,
      // V128 — echo back the version this client last read (not a form
      // field the user edits) so the backend can detect a concurrent edit.
      rowVersion: editing?.rowVersion ?? 0,
    };
    const saved = await save.mutateAsync({ id: editing?.collateralId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const cpOpts = useMemo(
    () => counterparties.map((c) => ({ value: c.counterpartyId, label: `${c.cpCode} — ${c.legalName}` })),
    [counterparties],
  );
  const leOpts = useMemo(
    () => legalEntities.map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[]).map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );
  const collateralTypeOpts = useMemo(
    () => collateralTypeRows.map((t) => ({ value: t.collateralTypeId, label: `${t.typeCode} — ${t.typeName}` })),
    [collateralTypeRows],
  );

  const colDefs = useMemo<ColDef<Collateral>[]>(() => [
    { field: 'collateralTypeName', headerName: 'Collateral Type', flex: 1, minWidth: 160, tooltipValueGetter: (p) => p.value },
    { field: 'direction', headerName: 'Direction', width: 100, cellRenderer: (p: { value: string }) => <Tag color={p.value === 'POSTED' ? 'orange' : 'green'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 140 },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Face Value', width: 140,
      valueGetter: (p) => `${p.data?.currencyCode} ${(p.data?.faceValue ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    { field: 'haircutPct', headerName: 'Haircut %', width: 100, cellClass: 'cell-mono' },
    { field: 'postingDate', headerName: 'Posted', width: 105, cellClass: 'cell-mono' },
    {
      field: 'status', headerName: 'Status', width: 110,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Collateral }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Collateral"
        description="Cash and non-cash collateral posted or received — linked to a counterparty's credit exposure, a margin account, or a letter of credit."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Collateral Record"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.collateralId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Collateral' : 'New Collateral'}
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
        <Form form={form} layout="vertical">
          <Form.Item name="collateralTypeId" label={hint('Collateral Type', 'Determines the standard haircut applied — cash needs none, government/corporate bonds and letters of credit carry a discount to face value.')} rules={[{ required: true }]}>
            <Select options={collateralTypeOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="direction" label={hint('Direction', 'POSTED = we gave collateral to a counterparty/exchange. RECEIVED = a counterparty gave collateral to us.')} rules={[{ required: true }]}>
            <Select options={COLLATERAL_DIRECTIONS.map((d) => ({ value: d, label: d }))} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item
              name="securedEntityType"
              label={hint('Secures', 'What this collateral protects against — a counterparty\'s credit exposure, an exchange margin account, or an LC.')}
              style={{ width: '55%' }}
              rules={[{ required: true }]}
            >
              <Select options={SECURED_ENTITY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
            </Form.Item>
            <Form.Item name="securedEntityId" label={hint('Secured Entity ID', 'Identifies the obligation this collateral secures — e.g. a trade, account, or credit line.')} style={{ width: '45%' }} rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="legalEntityId" label="Our Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="counterpartyId" label="Counterparty">
            <Select options={cpOpts} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="faceValue" label="Face Value" style={{ width: '65%' }} rules={[{ required: true }, { type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="currencyId" label="Currency" style={{ width: '35%' }} rules={[{ required: true }]}>
              <Select options={currencyOpts} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="marketValue" label={hint('Market Value', 'Current mark-to-market value — for cash this equals face value; for bonds/equities it moves with the market.')} rules={[{ type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="haircutPct" label={hint('Haircut %', 'Discount applied to market value for margin purposes — pre-filled from the Collateral Type\'s standard haircut, override if needed.')} rules={[{ type: 'number', min: 0, max: 100 }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="instrumentIsin" label={hint('Instrument ISIN', 'ISIN = International Securities Identification Number — unique code for the pledged security.')}>
            <Input maxLength={12} style={{ textTransform: 'uppercase', fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="instrumentDesc" label="Instrument Description">
            <Input />
          </Form.Item>
          <Form.Item name="postingDate" label="Posting Date" rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="maturityDate"
            dependencies={['postingDate']}
            label="Maturity Date"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const post = getFieldValue('postingDate');
                  if (!value || !post || !value.isBefore(post)) return Promise.resolve();
                  return Promise.reject(new Error('Maturity date must be on or after the posting date'));
                },
              }),
            ]}
          >
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={COLLATERAL_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} updatedAt={editing?.updatedAt} />
      </Drawer>
    </>
  );
}
