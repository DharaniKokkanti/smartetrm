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
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useRegulatoryObligations, useSaveRegulatoryObligation, useDeactivateRegulatoryObligation } from './hooks';
import { OBLIGATION_TYPES, type RegulatoryObligation, type RegulatoryObligationInput } from './types';

const TYPE_COLOR: Record<string, string> = { FULL: 'blue', DELEGATED: 'purple', EXEMPT: 'default', PARTIAL: 'orange' };

export function RegulatoryObligationsPage() {
  const { data = [], isLoading, refetch } = useRegulatoryObligations();
  const save = useSaveRegulatoryObligation();
  const deactivate = useDeactivateRegulatoryObligation();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: reportTypeRows = [] } = useTableRows<{ reportTypeId: number; reportCode: string; reportName: string }>('regulatory_report_type');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RegulatoryObligation | null>(null);
  const [form] = Form.useForm<RegulatoryObligationInput>();
  useFormDraft('regulatory-obligations', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ obligationType: 'FULL', isActive: true } as unknown as RegulatoryObligationInput);
    setOpen(true);
  }

  function openEdit(r: RegulatoryObligation) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      registeredDate: r.registeredDate ? dayjs(r.registeredDate) : undefined,
      effectiveFrom: r.effectiveFrom ? dayjs(r.effectiveFrom) : undefined,
      effectiveTo: r.effectiveTo ? dayjs(r.effectiveTo) : undefined,
    } as unknown as RegulatoryObligationInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: RegulatoryObligationInput = {
      ...values,
      registeredDate: v.registeredDate ? v.registeredDate.format('YYYY-MM-DD') : null,
      effectiveFrom: v.effectiveFrom ? v.effectiveFrom.format('YYYY-MM-DD') : values.effectiveFrom,
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
      rowVersion: editing?.rowVersion ?? 0,
    };
    const saved = await save.mutateAsync({ id: editing?.obligationId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const leOpts = useMemo(
    () => legalEntities.map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.entityName}` })),
    [legalEntities],
  );
  const reportTypeOpts = useMemo(
    () => reportTypeRows.map((t) => ({ value: t.reportTypeId, label: `${t.reportCode} — ${t.reportName}` })),
    [reportTypeRows],
  );

  const colDefs = useMemo<ColDef<RegulatoryObligation>[]>(() => [
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 150 },
    { field: 'reportTypeName', headerName: 'Report Type', flex: 1, minWidth: 180 },
    { field: 'obligationType', headerName: 'Obligation', width: 120, cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'reportingEntityName', headerName: 'Reports Via', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveFrom', headerName: 'Effective', width: 105, cellClass: 'cell-mono' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: RegulatoryObligation }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this obligation?" onConfirm={() => deactivate.mutate(p.data.obligationId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Regulatory Obligations"
        description="REMIT, EMIR, CFTC, MiFID II reporting obligations — which legal entity must report to which regime, by when, and whether it's delegated to a counterparty."
        moduleGroup="contracts"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Obligation"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.obligationId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Regulatory Obligation' : 'New Regulatory Obligation'}
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
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="reportTypeId" label="Report Type" rules={[{ required: true }]}>
            <Select options={reportTypeOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item
            name="obligationType"
            label={hint('Obligation Type', 'FULL = we report directly. DELEGATED = reporting delegated to a counterparty/agent. EXEMPT = not subject to this regime. PARTIAL = only certain product types.')}
            rules={[{ required: true }]}
          >
            <Select options={OBLIGATION_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item name="applicableCommodities" label="Applicable Commodities">
            <Input placeholder="CSV, blank = all" />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.obligationType !== c.obligationType}>
            {({ getFieldValue }) => getFieldValue('obligationType') === 'DELEGATED' && (
              <Form.Item name="reportingEntityId" label={hint('Reporting Entity', 'Who reports on our behalf when delegated.')} rules={[{ required: true }]}>
                <Select options={leOpts} showSearch optionFilterProp="label" />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item name="registrationRef" label={hint('Registration Reference', 'LEI or regulatory registration ID used for this obligation.')}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="registeredDate" label="Registered Date">
            <AppDatePicker />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]}>
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="effectiveTo"
            dependencies={['effectiveFrom']}
            label="Effective To"
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const from = getFieldValue('effectiveFrom');
                  if (!value || !from || !value.isBefore(from)) return Promise.resolve();
                  return Promise.reject(new Error('Effective To must be on or after Effective From'));
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
