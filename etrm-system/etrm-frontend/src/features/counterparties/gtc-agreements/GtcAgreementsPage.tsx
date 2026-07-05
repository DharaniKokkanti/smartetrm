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
import dayjs, { type Dayjs } from 'dayjs';
import { useCounterparties } from '@features/trade/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useGtcs } from '@features/contracts/gtcs/hooks';
import { useCpGtcAgreements, useSaveCpGtcAgreement, useDeactivateCpGtcAgreement } from './hooks';
import type { CpGtcAgreement, CpGtcAgreementInput } from './types';

export function GtcAgreementsPage() {
  const { data = [], isLoading, refetch } = useCpGtcAgreements();
  const save = useSaveCpGtcAgreement();
  const deactivate = useDeactivateCpGtcAgreement();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: gtcs = [] } = useGtcs();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CpGtcAgreement | null>(null);
  const [form] = Form.useForm<CpGtcAgreementInput>();
  useFormDraft('cp-gtc-agreements', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true } as unknown as CpGtcAgreementInput);
    setOpen(true);
  }

  function openEdit(r: CpGtcAgreement) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      signedDate: r.signedDate ? dayjs(r.signedDate) : undefined,
      effectiveDate: r.effectiveDate ? dayjs(r.effectiveDate) : undefined,
      expiryDate: r.expiryDate ? dayjs(r.expiryDate) : undefined,
    } as unknown as CpGtcAgreementInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: CpGtcAgreementInput = {
      ...values,
      signedDate: v.signedDate ? v.signedDate.format('YYYY-MM-DD') : null,
      effectiveDate: v.effectiveDate ? v.effectiveDate.format('YYYY-MM-DD') : values.effectiveDate,
      expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.cpGtcId ?? null, input });
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
  const gtcOpts = useMemo(
    () => (gtcs as { gtcId: number; gtcCode: string; gtcName: string; version: string }[])
      .map((g) => ({ value: g.gtcId, label: `${g.gtcCode} — ${g.gtcName} (v${g.version})` })),
    [gtcs],
  );

  const colDefs = useMemo<ColDef<CpGtcAgreement>[]>(() => [
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 150 },
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 150 },
    { field: 'gtcName', headerName: 'GTC', flex: 1, minWidth: 180 },
    { field: 'gtcVersion', headerName: 'Version', width: 100, cellRenderer: (p: { value: string }) => <Tag>{p.value}</Tag> },
    { field: 'signedDate', headerName: 'Signed', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveDate', headerName: 'Effective', width: 105, cellClass: 'cell-mono' },
    { field: 'expiryDate', headerName: 'Expiry', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: CpGtcAgreement }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this GTC agreement?" onConfirm={() => deactivate.mutate(p.data.cpGtcId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="CP GTC Agreements"
        description="Which GTC version is agreed per counterparty and legal entity — the contractual foundation for each relationship. A counterparty may agree different GTCs per legal entity or commodity."
        moduleGroup="trade"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New GTC Agreement"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.cpGtcId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit GTC Agreement' : 'New GTC Agreement'}
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
          <Form.Item
            name="gtcId"
            label={hint('GTC', 'The General Terms & Conditions document version this relationship trades under.')}
            rules={[{ required: true }]}
          >
            <Select options={gtcOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="signedDate" label="Signed Date">
            <AppDatePicker />
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
      </Drawer>
    </>
  );
}
