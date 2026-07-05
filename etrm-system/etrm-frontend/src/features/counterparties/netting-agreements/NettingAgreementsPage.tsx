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
import dayjs, { type Dayjs } from 'dayjs';
import { useCounterparties } from '@features/trade/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useNettingAgreements, useSaveNettingAgreement, useDeactivateNettingAgreement } from './hooks';
import { NETTING_AGREEMENT_TYPES, type NettingAgreement, type NettingAgreementInput } from './types';

const TYPE_LABELS: Record<string, string> = {
  ISDA_2002: 'ISDA 2002', ISDA_1992: 'ISDA 1992', EFET: 'EFET', GTMA: 'GTMA', NAESB: 'NAESB', OTHER: 'Other',
};
const TYPE_COLOR: Record<string, string> = {
  ISDA_2002: 'blue', ISDA_1992: 'geekblue', EFET: 'green', GTMA: 'purple', NAESB: 'orange', OTHER: 'default',
};

export function NettingAgreementsPage() {
  const { data = [], isLoading, refetch } = useNettingAgreements();
  const save = useSaveNettingAgreement();
  const deactivate = useDeactivateNettingAgreement();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<NettingAgreement | null>(null);
  const [form] = Form.useForm<NettingAgreementInput>();
  useFormDraft('netting-agreements', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ agreementType: 'ISDA_2002', isActive: true } as unknown as NettingAgreementInput);
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
    };
    const saved = await save.mutateAsync({ id: editing?.nettingId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const cpOpts = useMemo(
    () => (counterparties as { counterpartyId: number; counterpartyCode: string; name: string }[])
      .map((c) => ({ value: c.counterpartyId, label: `${c.counterpartyCode} — ${c.name}` })),
    [counterparties],
  );
  const leOpts = useMemo(
    () => (legalEntities as { legalEntityId: number; entityCode: string; entityName: string }[])
      .map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );

  const colDefs = useMemo<ColDef<NettingAgreement>[]>(() => [
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 150 },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 150 },
    {
      field: 'agreementType', headerName: 'Type', width: 120,
      cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{TYPE_LABELS[p.value] ?? p.value}</Tag>,
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
  ], [deactivate]);

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
            <Select options={NETTING_AGREEMENT_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))} />
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
      </Drawer>
    </>
  );
}
