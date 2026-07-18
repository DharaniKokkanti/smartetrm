import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Select, Switch, Input } from 'antd';
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
import { useCounterparties } from '@features/trade/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { usePaymentTerms } from '@features/contracts/payment-terms/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { COMMODITY_TYPES_TRADE } from '@features/trade/types';
import { useCpCommercialTerms, useSaveCpCommercialTerms, useDeactivateCpCommercialTerms } from './hooks';
import type { CpCommercialTerms, CpCommercialTermsInput } from './types';

export function CommercialTermsPage() {
  const { data = [], isLoading, refetch } = useCpCommercialTerms();
  const save = useSaveCpCommercialTerms();
  const deactivate = useDeactivateCpCommercialTerms();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: paymentTerms = [] } = usePaymentTerms();
  const { data: creditTermRows = [] } = useTableRows<{ creditTermId: number; termCode: string; termName: string }>('credit_term');
  const { data: currencies = [] } = useCurrencies();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CpCommercialTerms | null>(null);
  const [form] = Form.useForm<CpCommercialTermsInput>();
  useFormDraft('cp-commercial-terms', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true } as unknown as CpCommercialTermsInput);
    setOpen(true);
  }

  function openEdit(r: CpCommercialTerms) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      effectiveDate: r.effectiveDate ? dayjs(r.effectiveDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
    } as unknown as CpCommercialTermsInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: CpCommercialTermsInput = {
      ...values,
      effectiveDate: v.effectiveDate ? v.effectiveDate.format('YYYY-MM-DD') : values.effectiveDate,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.cpTermsId ?? null, input });
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
  const paymentTermOpts = useMemo(
    () => (paymentTerms as { paymentTermId: number; termCode: string; termName: string }[])
      .map((t) => ({ value: t.paymentTermId, label: `${t.termCode} — ${t.termName}` })),
    [paymentTerms],
  );
  const creditTermOpts = useMemo(
    () => creditTermRows.map((t) => ({ value: t.creditTermId, label: `${t.termCode} — ${t.termName}` })),
    [creditTermRows],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[])
      .map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );

  const colDefs = useMemo<ColDef<CpCommercialTerms>[]>(() => [
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 150 },
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 150 },
    { field: 'paymentTermName', headerName: 'Payment Term', flex: 1, minWidth: 150, tooltipValueGetter: (p) => p.value },
    { field: 'creditTermName', headerName: 'Credit Term', flex: 1, minWidth: 150, tooltipValueGetter: (p) => p.value },
    {
      field: 'commodityType', headerName: 'Commodity', width: 110,
      cellRenderer: (p: { value: string | null }) => p.value ? <Tag>{p.value}</Tag> : <span style={{ opacity: 0.45 }}>All</span>,
    },
    { field: 'effectiveDate', headerName: 'Effective', width: 105, cellClass: 'cell-mono' },
    { field: 'expiryDate', headerName: 'Expiry', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: CpCommercialTerms }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate these commercial terms?" onConfirm={() => deactivate.mutate(p.data.cpTermsId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="CP Commercial Terms"
        description="Default payment terms, credit terms, and currency/Incoterm preferences per counterparty–legal entity pair. Can be overridden at deal level; commodity type scopes to a subset if a counterparty trades multiple commodities on different terms."
        moduleGroup="trade"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Commercial Terms"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.cpTermsId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Commercial Terms' : 'New Commercial Terms'}
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
          <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}>
            <Select options={cpOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="paymentTermId" label="Payment Term" rules={[{ required: true }]}>
            <Select options={paymentTermOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="creditTermId" label={hint('Credit Term', 'e.g. NET_30 = payment due 30 days after invoice date. PREPAY = payment required before delivery.')} rules={[{ required: true }]}>
            <Select options={creditTermOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="defaultCurrencyId" label="Default Currency">
            <Select options={currencyOpts} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="commodityType"
            label={hint('Commodity Type', 'Scopes these terms to one commodity — leave blank if the same terms apply across everything traded with this counterparty.')}
          >
            <Select options={COMMODITY_TYPES_TRADE.map((c) => ({ value: c, label: c }))} allowClear />
          </Form.Item>
          <Form.Item name="effectiveDate" label="Effective Date" rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="expiryDate"
            dependencies={['effectiveDate']}
            label="Expiry Date"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const eff = getFieldValue('effectiveDate');
                  if (!value || !eff || !value.isBefore(eff)) return Promise.resolve();
                  return Promise.reject(new Error('Expiry date must be on or after the effective date'));
                },
              }),
            ]}
          >
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} updatedAt={editing?.updatedAt} />
      </Drawer>
    </>
  );
}
