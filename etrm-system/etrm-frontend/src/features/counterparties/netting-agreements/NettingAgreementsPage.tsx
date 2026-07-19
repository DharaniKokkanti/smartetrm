import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
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
import { useNettingAgreements, useSaveNettingAgreement, useDeactivateNettingAgreement } from './hooks';
import { type NettingAgreement, type NettingAgreementInput } from './types';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';

const TYPE_COLOR: Record<string, string> = {
  'ISDA 2002 MA': 'blue', 'ISDA 1992 MA': 'geekblue', 'EFET GTMA': 'green', GTMA: 'purple', NAESB: 'orange', Other: 'default',
};

export function NettingAgreementsPage() {
  const { data = [], isLoading, refetch } = useNettingAgreements();
  const save = useSaveNettingAgreement();
  const deactivate = useDeactivateNettingAgreement();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: agreementTypeOptions = [], isLoading: loadingAgreementTypes } = useCustomConfigOptions('NETTING_AGREEMENT_TYPE');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NettingAgreement | null>(null);
  const [form] = Form.useForm<NettingAgreementInput>();
  useFormDraft('netting-agreements', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      agreementType: agreementTypeOptions.find((o) => o.label === 'ISDA 2002 MA')?.value,
      isActive: true,
    } as unknown as NettingAgreementInput);
    setOpen(true);
  }

  function openEdit(r: NettingAgreement) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      effectiveDate: r.effectiveDate ? dayjs(r.effectiveDate) : undefined,
      terminationDate: r.terminationDate ? dayjs(r.terminationDate) : undefined,
    } as unknown as NettingAgreementInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: NettingAgreementInput = {
      ...values,
      effectiveDate: v.effectiveDate ? v.effectiveDate.format('YYYY-MM-DD') : values.effectiveDate,
      terminationDate: v.terminationDate ? v.terminationDate.format('YYYY-MM-DD') : null,
      // V128 — echo back the version this client last read (not a form
      // field the user edits) so the backend can detect a concurrent edit.
      rowVersion: editing?.rowVersion ?? 0,
    };
    const saved = await save.mutateAsync({ id: editing?.nettingId ?? null, input });
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

  const colDefs = useMemo<ColDef<NettingAgreement>[]>(() => [
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 150 },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 150 },
    {
      field: 'agreementType', headerName: 'Type', width: 120,
      cellRenderer: (p: { value: number }) => {
        const label = agreementTypeOptions.find((o) => o.value === p.value)?.label ?? '—';
        return <Tag color={TYPE_COLOR[label] ?? 'default'} style={{ fontSize: 10 }}>{label}</Tag>;
      },
    },
    { field: 'agreementRef', headerName: 'Agreement Ref', width: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveDate', headerName: 'Effective', width: 105, cellClass: 'cell-mono' },
    { field: 'terminationDate', headerName: 'Termination', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: NettingAgreement }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this netting agreement?" onConfirm={() => deactivate.mutate(p.data.nettingId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate, agreementTypeOptions]);

  return (
    <>
      <PageHeader
        title="Netting Agreements"
        description="ISDA/EFET/GTMA/NAESB master netting agreements per legal entity–counterparty pair. Determines whether offsetting trades can be netted for settlement and credit exposure calculation."
        moduleGroup="trade"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Netting Agreement"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.nettingId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Netting Agreement — ${editing.agreementRef ?? editing.nettingId}` : 'New Netting Agreement'}
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
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}>
            <Select options={cpOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="agreementType"
            label={hint('Agreement Type', 'ISDA 2002/1992 = general OTC derivatives master agreement. EFET = European gas/power physical & financial. GTMA = grain trade. NAESB = North American gas/power.')}
            rules={[{ required: true }]}
          >
            <Select options={agreementTypeOptions} loading={loadingAgreementTypes} />
          </Form.Item>
          <Form.Item name="agreementRef" label="Agreement Reference">
            <Input placeholder="Internal reference number" />
          </Form.Item>
          <Form.Item name="effectiveDate" label="Effective Date" rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="terminationDate"
            dependencies={['effectiveDate']}
            label={hint('Termination Date', 'Leave blank for an open-ended agreement.')}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const eff = getFieldValue('effectiveDate');
                  if (!value || !eff || !value.isBefore(eff)) return Promise.resolve();
                  return Promise.reject(new Error('Termination date must be on or after the effective date'));
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
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
