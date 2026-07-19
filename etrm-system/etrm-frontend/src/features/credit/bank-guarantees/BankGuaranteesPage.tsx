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
import { useBankGuarantees, useSaveBankGuarantee } from './hooks';
import { BG_TYPES, BG_STATUSES, type BankGuarantee, type BankGuaranteeInput } from './types';

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', ISSUED: 'blue', AMENDED: 'geekblue', CALLED: 'volcano',
  EXPIRED: 'default', CANCELLED: 'default', DISCHARGED: 'success',
};

export function BankGuaranteesPage() {
  const { data = [], isLoading, refetch } = useBankGuarantees();
  const save = useSaveBankGuarantee();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: currencies = [] } = useCurrencies();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankGuarantee | null>(null);
  const [form] = Form.useForm<BankGuaranteeInput>();
  useFormDraft('bank-guarantees', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ bgType: 'PERFORMANCE', bgStatus: 'DRAFT', claimPeriodDays: 30, amountCalled: 0 } as unknown as BankGuaranteeInput);
    setOpen(true);
  }

  function openEdit(r: BankGuarantee) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      issueDate: r.issueDate ? dayjs(r.issueDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
    } as unknown as BankGuaranteeInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: BankGuaranteeInput = {
      ...values,
      issueDate: v.issueDate ? v.issueDate.format('YYYY-MM-DD') : values.issueDate,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : values.expiryDate,
      // V128 — echo back the version this client last read (not a form
      // field the user edits) so the backend can detect a concurrent edit.
      rowVersion: editing?.rowVersion ?? 0,
    };
    const saved = await save.mutateAsync({ id: editing?.bgId ?? null, input });
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

  const colDefs = useMemo<ColDef<BankGuarantee>[]>(() => [
    { field: 'bgNumber', headerName: 'BG Number', width: 160, pinned: 'left', cellClass: 'cell-mono' },
    {
      field: 'bgType', headerName: 'Type', width: 130,
      cellRenderer: (p: { value: string }) => <Tag style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    { field: 'principalEntityName', headerName: 'Principal (Us)', flex: 1, minWidth: 140 },
    { field: 'beneficiaryCpName', headerName: 'Beneficiary', flex: 1, minWidth: 140 },
    { field: 'issuingBankName', headerName: 'Issuing Bank', flex: 1, minWidth: 140 },
    {
      headerName: 'Amount', width: 140,
      valueGetter: (p) => `${p.data?.currencyCode} ${(p.data?.guaranteeAmount ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    { field: 'expiryDate', headerName: 'Expiry', width: 105, cellClass: 'cell-mono' },
    {
      field: 'bgStatus', headerName: 'Status', width: 120,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: BankGuarantee }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Bank Guarantees"
        description="Performance and payment bank guarantees issued or received — guarantor bank, amount, expiry, and commodity context. Tracks the full lifecycle from draft through discharge or call."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Bank Guarantee"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.bgId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Bank Guarantee — ${editing.bgNumber}` : 'New Bank Guarantee'}
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
          <Form.Item name="bgNumber" label={hint('BG Number', 'BG = Bank Guarantee — the issuing bank\'s reference number for this instrument.')} rules={[{ required: true }]}>
            <Input placeholder="BG-2026-0001" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item
            name="bgType"
            label={hint('BG Type', 'PERFORMANCE = guarantees contract performance. PAYMENT = guarantees payment. ADVANCE_PAYMENT = guarantees return of a prepayment. BID_BOND = guarantees a tender/bid. STANDBY_LC = standby letter of credit form.')}
            rules={[{ required: true }]}
          >
            <Select options={BG_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="principalEntityId" label={hint('Principal (Us)', 'Our legal entity that is the obligor — whose performance/payment this guarantee backs.')} rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="beneficiaryCpId" label="Beneficiary" rules={[{ required: true }]}>
            <Select options={cpOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="issuingBankId" label={hint('Issuing Bank', 'The bank that issued the guarantee on our behalf — modeled as a counterparty.')} rules={[{ required: true }]}>
            <Select options={cpOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="guaranteeAmount" label="Guarantee Amount" style={{ width: '65%' }} rules={[{ required: true }, { type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="currencyId" label="Currency" style={{ width: '35%' }} rules={[{ required: true }]}>
              <Select options={currencyOpts} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="expiryDate"
            dependencies={['issueDate']}
            label="Expiry Date"
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const iss = getFieldValue('issueDate');
                  if (!value || !iss || !value.isBefore(iss)) return Promise.resolve();
                  return Promise.reject(new Error('Expiry date must be on or after the issue date'));
                },
              }),
            ]}
          >
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="claimPeriodDays" label={hint('Claim Period (Days)', 'Days after expiry within which the beneficiary may still make a claim.')} rules={[{ required: true }, { type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="bgStatus" label="Status" rules={[{ required: true }]}>
            <Select options={BG_STATUSES.map((s) => ({ value: s, label: s }))} />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.bgStatus !== cur.bgStatus}>
            {({ getFieldValue }) =>
              getFieldValue('bgStatus') === 'CALLED' && (
                <Form.Item name="amountCalled" label={hint('Amount Called', 'Portion of the guarantee amount actually drawn/invoked by the beneficiary.')} rules={[{ required: true }, { type: 'number', min: 0 }]}>
                  <InputNumber style={{ width: '100%' }} min={0} />
                </Form.Item>
              )
            }
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
