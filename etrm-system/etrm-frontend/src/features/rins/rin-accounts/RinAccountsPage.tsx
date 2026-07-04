import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Tooltip } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useLegalEntities } from '@features/trade/hooks';
import { useRinAccounts, useSaveRinAccount, useDeactivateRinAccount } from './hooks';
import type { RinAccount, RinAccountInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const ACCOUNT_TYPE_COLOR: Record<string, string> = {
  OBLIGATED_PARTY: 'red', RENEWABLE_FUEL_PRODUCER: 'green', TRADING: 'blue', EXPORTER: 'orange',
};
const ACCOUNT_TYPE_OPTS = [
  { value: 'OBLIGATED_PARTY',        label: 'Obligated Party (Blender / Importer)' },
  { value: 'RENEWABLE_FUEL_PRODUCER',label: 'Renewable Fuel Producer' },
  { value: 'TRADING',                label: 'Trading Account (Separated RINs)' },
  { value: 'EXPORTER',               label: 'Exporter' },
];

export function RinAccountsPage() {
  const { data = [], isLoading, refetch } = useRinAccounts();
  const save       = useSaveRinAccount();
  const deactivate = useDeactivateRinAccount();
  const { data: legalEntities = [] } = useLegalEntities();

  const leOpts = useMemo(
    () => (legalEntities as { legalEntityId: number; entityCode: string; name: string }[])
      .map((e) => ({ value: e.legalEntityId, label: `${e.entityCode} — ${e.name}` })),
    [legalEntities],
  );

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<RinAccount | null>(null);
  const [form]                = Form.useForm<RinAccountInput>();
  useFormDraft('rins-accounts', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ accountType: 'OBLIGATED_PARTY', isActive: true });
    setOpen(true);
  }
  function openEdit(r: RinAccount) {
    setEditing(r);
    form.setFieldsValue({ ...r, epaFacilityId: r.epaFacilityId ?? undefined });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.accountId ?? null, input: { ...v, epaFacilityId: v.epaFacilityId ?? null } });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<RinAccount>[]>(() => [
    { field: 'accountCode', headerName: 'Account Code', width: 140, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'accountName', headerName: 'Account Name', flex: 1.2, minWidth: 180 },
    { field: 'accountType', headerName: 'Type', width: 200,
      cellRenderer: (p: { value: string }) => {
        const label = ACCOUNT_TYPE_OPTS.find((o) => o.value === p.value)?.label ?? p.value;
        return <Tag color={ACCOUNT_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{label}</Tag>;
      } },
    { field: 'entityName',    headerName: 'Legal Entity',   flex: 1, minWidth: 160 },
    { field: 'epaCompanyId',  headerName: 'EPA Company ID', width: 140, cellClass: 'cell-mono' },
    { field: 'epaFacilityId', headerName: 'EPA Facility ID', width: 145, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Active', width: 80, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: RinAccount }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.isActive && (
            <Popconfirm title="Deactivate this RIN account?" onConfirm={() => deactivate.mutate(p.data.accountId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ) },
  ], [deactivate]);

  return (
    <>
      <PageHeader
        title="RIN Accounts"
        description="EPA EMTS (Moderated Transaction System) accounts used to hold, transfer, and retire RINs. Each obligated party registers a company-level account; renewable fuel producers may also register facility-level accounts for RIN generation."
        moduleGroup="rins"
      />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Account" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.accountId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit — ${editing.accountCode}` : 'New RIN Account'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="accountCode" label="Account Code" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="RIN-OBL-001" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="accountType" label="Account Type" rules={[{ required: true }]} style={{ flex: 1.6 }}>
              <Select options={ACCOUNT_TYPE_OPTS} />
            </Form.Item>
          </Space>
          <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
            <Input placeholder="NonameETRM Trading — Obligated Party Account" />
          </Form.Item>
          <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
            <Select options={leOpts} showSearch optionFilterProp="label" placeholder="Select entity" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="epaCompanyId" label={hint('EPA Company ID', 'Company-level ID assigned by EPA upon EMTS registration. Format: CO followed by 7 digits.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="CO0012345" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="epaFacilityId" label={hint('EPA Facility ID', 'Facility-level ID for renewable fuel producer accounts. Leave blank for company-level accounts.')} style={{ flex: 1 }}>
              <Input placeholder="FAC-B001 (optional)" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
