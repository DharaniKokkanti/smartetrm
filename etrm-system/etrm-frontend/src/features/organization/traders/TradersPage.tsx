import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Tooltip, Drawer, Form, Input, Select, Switch, InputNumber, Divider, Typography } from 'antd';
import { StopOutlined, EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTraders, useDeactivateTrader, useSaveTrader } from './hooks';
import type { Trader, TraderInput } from './types';
import { COMMODITY_TYPES } from '../desks/types';
import { useFormDraft } from '@components/smart/formDraft';

const COMMODITY_COLOR: Record<string, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
};

export function TradersPage() {
  const { data, isLoading, refetch } = useTraders();
  const deactivate = useDeactivateTrader();
  const save = useSaveTrader();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trader | null>(null);
  const [form] = Form.useForm<TraderInput>();
  useFormDraft('org-traders', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); setOpen(true); }
  function openEdit(t: Trader) {
    setEditing(t);
    form.resetFields();
    form.setFieldsValue({ traderCode: t.traderCode, userId: t.userId, legalEntityId: t.legalEntityId, deskId: t.deskId, approverTraderId: t.approverTraderId, commodityTypes: t.commodityTypes, goLiveDate: t.goLiveDate ?? undefined, isActive: t.isActive });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.traderId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Trader>[]>(() => [
    { field: 'traderCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left',
      tooltipValueGetter: () => 'Unique trader identifier used across deal capture and risk systems' },
    { field: 'fullName', headerName: 'Name', flex: 1.2, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
    { field: 'deskCode', headerName: 'Desk', width: 130, cellClass: 'cell-mono' },
    {
      field: 'commodityTypes', headerName: 'Commodities', width: 260, sortable: false,
      tooltipValueGetter: () => 'Commodities this trader is authorised to trade — separate limits apply per commodity',
      cellRenderer: (p: { value: string[] }) => p.value?.map((c) => <Tag key={c} color={COMMODITY_COLOR[c]}>{c}</Tag>),
    },
    {
      headerName: 'Trade Limits', width: 200, sortable: false, filter: false,
      tooltipValueGetter: () => 'Single trade and daily aggregate limits per commodity — hover for breakdown',
      cellRenderer: (p: { data: Trader }) => (
        <Tooltip title={
          p.data.commodityLimits.length === 0 ? 'No limits configured' :
          <div>{p.data.commodityLimits.map((l) => (
            <div key={l.commodityType} style={{ fontSize: 11, marginBottom: 2 }}>
              <b>{l.commodityType}</b>: Single ${Number(l.singleTradeLimit).toLocaleString()} · Daily ${Number(l.dailyTradeLimit).toLocaleString()}
            </div>
          ))}</div>
        }>
          <span style={{ cursor: 'default', fontSize: 12, opacity: 0.65, borderBottom: '1px dashed #aaa' }}>
            {p.data.commodityLimits.length} limit{p.data.commodityLimits.length !== 1 ? 's' : ''} set
          </span>
        </Tooltip>
      ),
    },
    { field: 'approverName', headerName: 'Approver', width: 160, valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Trader who must approve trades above single-trade limit' },
    { field: 'goLiveDate', headerName: 'Go-Live', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Trader }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this trader?" description="All open trades assigned to them will need re-assignment." onConfirm={() => deactivate.mutate(p.data.traderId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Traders"
        description="Trading staff — per-commodity trade and position limits, desk assignment, and approval chain configuration."
        moduleGroup="organization"
      />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading}
        onAdd={openNew} addLabel="New Trader"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.traderId)} />

      <Drawer title={editing ? `Edit Trader — ${editing.traderCode}` : 'New Trader'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="traderCode" label={hint('Trader Code', 'Unique alphanumeric identifier used in deal capture, risk reports, and position attribution. Cannot be changed once assigned.', 'JD-OIL-001', 'AAA-NNN-NNN')} rules={[{ required: true }]}>
            <Input placeholder="JD-OIL-001" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="userId" label={hint('User Account (ID)', 'Links this trader profile to the system login account (app_user table). One-to-one relationship — one user can hold only one active trader profile.')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="User ID from user management" />
          </Form.Item>
          <Form.Item name="legalEntityId" label={hint('Legal Entity (ID)', 'Legal entity this trader belongs to — determines regulatory reporting scope and trade booking entity. 1=SETRM-LTD, 2=SETRM-NL, 3=SETRM-SG.')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Legal Entity ID" />
          </Form.Item>
          <Form.Item name="deskId" label={hint('Trading Desk (ID)', 'Desk this trader belongs to. Determines P&L book hierarchy, commodity specialisation, and default approval routing.', '3 (OIL-CRUDE desk)')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} placeholder="Desk ID" />
          </Form.Item>
          <Form.Item name="commodityTypes" label={hint('Authorised Commodities', 'Commodities this trader is approved to trade. Each commodity gets independent position and trade limits. A trader covering OIL and POWER has two separate limit rows.', 'OIL, POWER')} rules={[{ required: true }]}>
            <Select mode="multiple" options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))} placeholder="Select commodities" />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>Approval Chain</Typography.Text></Divider>
          <Form.Item name="approverTraderId" label={hint('Approver Trader (ID)', 'Senior trader or desk head who must approve deals exceeding this trader\'s single-trade limit. Must have a higher limit than this trader. Leave blank if no approval required (e.g. senior traders).')}>
            <InputNumber style={{ width: '100%' }} placeholder="Approver Trader ID (optional)" />
          </Form.Item>
          <Form.Item name="goLiveDate" label={hint('Go-Live Date', 'Date from which this trader can submit live trades. Before this date the account is in setup mode — limits apply but deals are flagged as paper trades.', '2026-01-15', 'YYYY-MM-DD')}>
            <Input placeholder="2026-01-15" />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
