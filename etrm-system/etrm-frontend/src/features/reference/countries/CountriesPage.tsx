import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined, WarningFilled } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useCountries, useSaveCountry, useDeactivateCountry } from './hooks';
import { REGIONS, FATF_STATUSES, SANCTION_STATUSES, type Country, type CountryInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const FATF_COLOR: Record<string, string> = { COMPLIANT: 'success', GREY_LIST: 'warning', BLACK_LIST: 'error' };
const REGION_COLOR: Record<string, string> = { EUROPE: 'blue', AMERICAS: 'cyan', ASIA_PACIFIC: 'green', MIDDLE_EAST: 'gold', AFRICA: 'orange', CIS: 'purple' };

export function CountriesPage() {
  const { data, isLoading, refetch } = useCountries();
  const save = useSaveCountry();
  const deactivate = useDeactivateCountry();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Country | null>(null);
  const [form] = Form.useForm<CountryInput>();
  useFormDraft('ref-countries', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ fatfStatus: 'COMPLIANT', sanctionStatus: 'CLEAR', isActive: true }); setOpen(true); }
  function openEdit(r: Country) { setEditing(r); form.setFieldsValue({ ...r }); setOpen(true); }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ code: editing?.countryCode ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Country>[]>(() => [
    { field: 'countryCode', headerName: 'ISO', width: 70, pinned: 'left', cellClass: 'cell-mono', cellRenderer: (p: { value: string }) => <Tag color="geekblue" style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.value}</Tag> },
    { field: 'countryName', headerName: 'Country', flex: 1.5, minWidth: 160 },
    { field: 'region', headerName: 'Region', width: 130, cellRenderer: (p: { value: string }) => <Tag color={REGION_COLOR[p.value] ?? 'default'}>{p.value.replace('_', ' ')}</Tag> },
    { field: 'phoneCode', headerName: 'Phone', width: 80, cellClass: 'cell-mono' },
    { field: 'fatfStatus', headerName: 'FATF', width: 110,
      cellRenderer: (p: { value: string }) => p.value !== 'COMPLIANT'
        ? <Tag color={FATF_COLOR[p.value]} icon={<WarningFilled />}>{p.value.replace('_', ' ')}</Tag>
        : <Tag color="success">{p.value}</Tag> },
    { field: 'sanctionStatus', headerName: 'Sanctions', width: 130,
      cellRenderer: (p: { value: string }) => p.value !== 'CLEAR'
        ? <Tag color="error" icon={<WarningFilled />}>{p.value.replace('_', ' ')}</Tag>
        : <Tag color="success">CLEAR</Tag> },
    { field: 'isActive', headerName: 'Status', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Country }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate?" onConfirm={() => deactivate.mutate(p.data.countryCode)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      )},
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Countries" description="Country reference data with FATF and sanctions status — used in counterparty KYC, vessel flags, and trade compliance screening." moduleGroup="reference" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Country" onRefresh={() => { void refetch(); }} getRowId={(p) => p.data.countryCode} />
      <Drawer mask={false} forceRender title={editing ? `Edit ${editing.countryCode} — ${editing.countryName}` : 'New Country'} open={open} onClose={() => setOpen(false)} width={480}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="countryCode" label={hint('ISO Code', 'ISO 3166-1 alpha-2 two-letter country code. GB, US, NL, DE, AE. Cannot change once linked to records.', 'GB')} rules={[{ required: true, len: 2 }]}>
            <Input placeholder="GB" maxLength={2} style={{ fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 700 }} />
          </Form.Item>
          <Form.Item name="countryName" label="Country Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="region" label="Region" rules={[{ required: true }]}>
            <Select options={REGIONS.map((r) => ({ value: r, label: r.replace('_', ' ') }))} />
          </Form.Item>
          <Form.Item name="phoneCode" label="Phone Code"><Input placeholder="+44" /></Form.Item>
          <Form.Item name="fatfStatus" label={hint('FATF Status', 'FATF = Financial Action Task Force. Grey/Black list triggers enhanced KYC and transaction monitoring for all counterparties from this country.')} rules={[{ required: true }]}>
            <Select options={FATF_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
          </Form.Item>
          <Form.Item name="sanctionStatus" label={hint('Sanctions Status', 'OFAC = US Treasury. EU_SANCTIONS = European Union. UN_SANCTIONS = United Nations Security Council. Any flag blocks trading by applicable entities.')} rules={[{ required: true }]}>
            <Select options={SANCTION_STATUSES.map((s) => ({ value: s, label: s.replace('_', ' ') }))} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
