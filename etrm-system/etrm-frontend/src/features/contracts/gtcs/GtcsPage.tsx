import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, DatePicker } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useGtcs, useSaveGtc, useDeactivateGtc } from './hooks';
import { GTC_TYPES, type Gtc, type GtcInput, type GtcType } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const TYPE_COLOR: Record<GtcType, string> = {
  CRUDE_OIL: 'blue',
  GAS: 'green',
  LNG: 'cyan',
  POWER: 'yellow',
  METALS: 'gold',
  AGRICULTURAL: 'lime',
  FREIGHT: 'default',
  GENERIC: 'default',
  REFINED_PRODUCTS: 'orange',
};

export function GtcsPage() {
  const { data, isLoading, refetch } = useGtcs();
  const save = useSaveGtc();
  const deactivate = useDeactivateGtc();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Gtc | null>(null);
  const [form] = Form.useForm<GtcInput>();
  useFormDraft('contracts-gtcs', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('isActive', true);
    setOpen(true);
  }

  function openEdit(g: Gtc) {
    setEditing(g);
    form.setFieldsValue({
      gtcCode: g.gtcCode,
      gtcName: g.gtcName,
      gtcType: g.gtcType,
      version: g.version,
      effectiveDate: g.effectiveDate ? (dayjs(g.effectiveDate) as unknown as string) : undefined,
      expiryDate: g.expiryDate ? (dayjs(g.expiryDate) as unknown as string) : undefined,
      jurisdiction: g.jurisdiction,
      governingLaw: g.governingLaw,
      disputeResolution: g.disputeResolution,
      documentRef: g.documentRef ?? undefined,
      isActive: g.isActive,
    });
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const input: GtcInput = {
      ...v,
      effectiveDate: v.effectiveDate ? dayjs(v.effectiveDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : '',
      expiryDate: v.expiryDate ? dayjs(v.expiryDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.gtcId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Gtc>[]>(() => [
    { field: 'gtcCode', headerName: 'Code', cellClass: 'cell-mono', width: 160, pinned: 'left' },
    { field: 'gtcName', headerName: 'Name', flex: 1.5, minWidth: 200 },
    {
      field: 'gtcType', headerName: 'Type', width: 160,
      cellRenderer: (p: { value: GtcType }) => (
        <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag>
      ),
    },
    { field: 'version', headerName: 'Version', width: 110 },
    { field: 'effectiveDate', headerName: 'Effective', width: 120 },
    { field: 'jurisdiction', headerName: 'Jurisdiction', flex: 0.8 },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Gtc }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate GTC?" onConfirm={() => deactivate.mutate(p.data.gtcId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="General Terms & Conditions"
        description="Standard GTC sets applied to trade contracts — EFET Gas, BP crude GTCs, LME Metals rules, ISDA Master Agreement."
        moduleGroup="contracts"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New GTC"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.gtcId)}
      />

      <Drawer
        title={editing ? `Edit GTC — ${editing.gtcCode}` : 'New GTC'}
        open={open}
        onClose={() => setOpen(false)}
        width={600}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="gtcCode"
            label={hint(
              'GTC Code',
              'Short unique code for this GTC set — used in contract references and internal documents.',
              'BP-OIL-2020',
            )}
            rules={[{ required: true }]}
          >
            <Input placeholder="BP-OIL-2020" style={{ fontFamily: 'monospace' }} />
          </Form.Item>

          <Form.Item
            name="gtcName"
            label="GTC Name"
            rules={[{ required: true }]}
          >
            <Input placeholder="BP Standard Oil Trading Terms 2020" />
          </Form.Item>

          <Form.Item
            name="gtcType"
            label={hint(
              'GTC Type',
              'GTCs apply per commodity — crude GTCs (like BP/Shell standard form) differ substantially from gas (EFET) or metals (LME warrants).',
            )}
            rules={[{ required: true }]}
          >
            <Select options={GTC_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>

          <Form.Item
            name="version"
            label="Version"
            rules={[{ required: true }]}
          >
            <Input placeholder="2020-v3" />
          </Form.Item>

          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item
              name="effectiveDate"
              label="Effective Date"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
            <Form.Item
              name="expiryDate"
              label="Expiry Date"
              style={{ flex: 1 }}
            >
              <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
            </Form.Item>
          </Space>

          <Form.Item
            name="jurisdiction"
            label={hint(
              'Jurisdiction',
              'Legal jurisdiction of the contract. Affects enforcement, VAT, and regulatory reporting. Most oil trading: English law.',
              'England & Wales',
            )}
            rules={[{ required: true }]}
          >
            <Input placeholder="England & Wales" />
          </Form.Item>

          <Form.Item
            name="governingLaw"
            label="Governing Law"
            rules={[{ required: true }]}
          >
            <Input placeholder="English Law" />
          </Form.Item>

          <Form.Item
            name="disputeResolution"
            label={hint(
              'Dispute Resolution',
              'LCIA = London Court of International Arbitration. ICC = Paris. Arbitration preferred over court — confidential and internationally enforceable.',
              'LCIA',
            )}
            rules={[{ required: true }]}
          >
            <Input placeholder="LCIA" />
          </Form.Item>

          <Form.Item name="documentRef" label="Document Reference">
            <Input placeholder="DOC-2020-BP-OIL" />
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
