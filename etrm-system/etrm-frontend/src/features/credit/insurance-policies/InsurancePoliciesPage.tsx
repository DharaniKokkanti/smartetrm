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
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useTableRows } from '@features/tier2/hooks';
import {
  useInsurancePolicies, useSaveInsurancePolicy,
} from './hooks';
import {
  POLICY_TYPES, INSURED_ENTITY_TYPES, PREMIUM_FREQUENCIES, POLICY_STATUSES,
  type InsurancePolicy, type InsurancePolicyInput,
} from './types';

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success', EXPIRED: 'default', CANCELLED: 'default', SUSPENDED: 'warning', CLAIM_IN_PROGRESS: 'volcano',
};

export function InsurancePoliciesPage() {
  const { data = [], isLoading, refetch } = useInsurancePolicies();
  const save = useSaveInsurancePolicy();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: currencies = [] } = useCurrencies();
  const { data: providerRows = [] } = useTableRows<{ providerId: number; providerCode: string; providerName: string }>('insurance_provider');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InsurancePolicy | null>(null);
  const [form] = Form.useForm<InsurancePolicyInput>();
  useFormDraft('insurance-policies', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ policyType: 'CARGO', policyStatus: 'ACTIVE', deductible: 0 } as unknown as InsurancePolicyInput);
    setOpen(true);
  }

  function openEdit(r: InsurancePolicy) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      inceptionDate: r.inceptionDate ? dayjs(r.inceptionDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
    } as unknown as InsurancePolicyInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: InsurancePolicyInput = {
      ...values,
      inceptionDate: v.inceptionDate ? v.inceptionDate.format('YYYY-MM-DD') : values.inceptionDate,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : values.expiryDate,
      // V128 — echo back the version this client last read (not a form
      // field the user edits) so the backend can detect a concurrent edit.
      rowVersion: editing?.rowVersion ?? 0,
    };
    const saved = await save.mutateAsync({ id: editing?.policyId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const providerOpts = useMemo(
    () => providerRows.map((p) => ({ value: p.providerId, label: `${p.providerCode} — ${p.providerName}` })),
    [providerRows],
  );
  const leOpts = useMemo(
    () => (legalEntities as { legalEntityId: number; entityCode: string; entityName: string }[])
      .map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[]).map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );

  const colDefs = useMemo<ColDef<InsurancePolicy>[]>(() => [
    { field: 'policyNumber', headerName: 'Policy #', width: 140, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'policyType', headerName: 'Type', width: 110, cellRenderer: (p: { value: string }) => <Tag style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'providerName', headerName: 'Provider', flex: 1, minWidth: 150 },
    { field: 'legalEntityName', headerName: 'Insured Entity (Legal)', flex: 1, minWidth: 150 },
    {
      headerName: 'Sum Insured', width: 140,
      valueGetter: (p) => `${p.data?.currencyCode} ${(p.data?.sumInsured ?? 0).toLocaleString()}`,
      cellClass: 'cell-mono',
    },
    { field: 'expiryDate', headerName: 'Expiry', width: 105, cellClass: 'cell-mono' },
    {
      field: 'policyStatus', headerName: 'Status', width: 130,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: InsurancePolicy }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Insurance Policies"
        description="Cargo, credit, and political risk insurance policies — insurer, coverage period, and insured values per commodity or asset."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Insurance Policy"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.policyId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Policy — ${editing.policyNumber}` : 'New Insurance Policy'}
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
          <Form.Item name="providerId" label="Insurance Provider" rules={[{ required: true }]}>
            <Select options={providerOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="legalEntityId" label="Our Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="policyNumber" label="Policy Number" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="policyType" label="Policy Type" rules={[{ required: true }]}>
            <Select options={POLICY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item
              name="insuredEntityType"
              label={hint('Insured Entity Type', 'What this policy covers — leave blank if it\'s a general legal-entity-level policy (e.g. trade credit).')}
              style={{ width: '55%' }}
            >
              <Select options={INSURED_ENTITY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} allowClear />
            </Form.Item>
            <Form.Item name="insuredEntityId" label="Insured Entity ID" style={{ width: '45%' }}>
              <InputNumber style={{ width: '100%' }} placeholder="e.g. vessel ID" />
            </Form.Item>
          </Space.Compact>
          <Space.Compact block>
            <Form.Item name="sumInsured" label="Sum Insured" style={{ width: '65%' }} rules={[{ required: true }, { type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="currencyId" label="Currency" style={{ width: '35%' }} rules={[{ required: true }]}>
              <Select options={currencyOpts} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="deductible" label="Deductible" rules={[{ type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="premiumAmount" label="Premium Amount" style={{ width: '65%' }} rules={[{ type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
            <Form.Item name="premiumFrequency" label="Frequency" style={{ width: '35%' }}>
              <Select options={PREMIUM_FREQUENCIES.map((f) => ({ value: f, label: f.replace(/_/g, ' ') }))} allowClear />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="inceptionDate" label={hint('Inception Date', 'Insurance term for the date cover starts (policy start date).')} rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="expiryDate"
            dependencies={['inceptionDate']}
            label="Expiry Date"
            rules={[
              { required: true },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const inc = getFieldValue('inceptionDate');
                  if (!value || !inc || !value.isBefore(inc)) return Promise.resolve();
                  return Promise.reject(new Error('Expiry date must be on or after the inception date'));
                },
              }),
            ]}
          >
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="policyStatus" label="Status" rules={[{ required: true }]}>
            <Select options={POLICY_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
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
