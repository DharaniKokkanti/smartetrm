import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Tooltip, Drawer, Form, Input, Select, Switch, Divider, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { StopOutlined, EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTraders, useDeactivateTrader, useSaveTrader } from './hooks';
import type { Trader, TraderInput } from './types';
import { COMMODITY_TYPE_LOOKUP, commodityLabel, commodityCodeById } from '@features/reference/commodity-types/types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { AuditInfo } from '@components/smart/AuditInfo';
import { useBooks } from '../books/hooks';
import { DESK_LEVEL_TYPE_ID } from '../books/types';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useSystemUsers } from '@features/admin/system-users/hooks';

// Keyed by CommodityType code (not lookup_id) — resolve the id to its code
// via commodityCodeById() first, same as the rest of this codebase's
// pre-existing convention of coloring by a handful of common commodities
// and leaving the rest (LNG/FREIGHT/RINS/ENVIRONMENTAL/MULTI/OTHER) uncolored.
const COMMODITY_COLOR: Record<string, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
};

export function TradersPage() {
  const { data, isLoading, refetch } = useTraders();
  const { data: books } = useBooks();
  const deskBooks = (books ?? []).filter((b) => b.bookLevelTypeId === DESK_LEVEL_TYPE_ID);
  const { data: legalEntities } = useLegalEntities();
  const { data: systemUsers } = useSystemUsers();
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
    form.setFieldsValue({ traderCode: t.traderCode, userId: t.userId, legalEntityId: t.legalEntityId, bookId: t.bookId, approverTraderId: t.approverTraderId, commodityTypes: t.commodityTypes, goLiveDate: t.goLiveDate ? dayjs(t.goLiveDate) : undefined, isActive: t.isActive } as unknown as TraderInput);
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: TraderInput = { ...values, goLiveDate: v.goLiveDate ? v.goLiveDate.format('YYYY-MM-DD') : null };
    const saved = await save.mutateAsync({ id: editing?.traderId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Trader>[]>(() => [
    { field: 'traderCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left',
      tooltipValueGetter: () => 'Unique trader identifier used across deal capture and risk systems' },
    { field: 'fullName', headerName: 'Name', flex: 1.2, minWidth: 160 },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 200 },
    { field: 'bookCode', headerName: 'Desk', width: 130, cellClass: 'cell-mono' },
    {
      field: 'commodityTypes', headerName: 'Commodities', width: 260, sortable: false,
      tooltipValueGetter: () => 'Commodities this trader is authorised to trade — separate limits apply per commodity',
      cellRenderer: (p: { value: number[] }) => p.value?.map((id) => {
        const code = commodityCodeById(id);
        return <Tag key={id} color={code ? COMMODITY_COLOR[code] : undefined}>{commodityLabel(id)}</Tag>;
      }),
    },
    {
      headerName: 'Trade Limits', width: 200, sortable: false, filter: false,
      tooltipValueGetter: () => 'Single trade and daily aggregate limits per commodity — hover for breakdown',
      cellRenderer: (p: { data: Trader }) => (
        <Tooltip title={
          p.data.commodityLimits.length === 0 ? 'No limits configured' :
          <div>{p.data.commodityLimits.map((l) => (
            <div key={l.commodityType} style={{ fontSize: 11, marginBottom: 2 }}>
              <b>{commodityLabel(l.commodityType)}</b>: Single ${Number(l.singleTradeLimit).toLocaleString()} · Daily ${Number(l.dailyTradeLimit).toLocaleString()}
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

      <Drawer mask={false} forceRender title={editing ? `Edit Trader — ${editing.traderCode}` : 'New Trader'} open={open} onClose={() => setOpen(false)} width={520}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Form.Item name="traderCode" label={hint('Trader Code', 'Unique alphanumeric identifier used in deal capture, risk reports, and position attribution. Cannot be changed once assigned.', 'JD-OIL-001', 'AAA-NNN-NNN')} rules={[{ required: true }]}>
            <Input placeholder="JD-OIL-001" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="userId" label={hint('User Account', 'Links this trader profile to the system login account (app_user table). One-to-one relationship — one user can hold only one active trader profile.')} rules={[{ required: true }]}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select user account"
              options={(systemUsers ?? []).map((u) => ({ label: `${u.fullName} (${u.username})`, value: u.userId }))} />
          </Form.Item>
          <Form.Item name="legalEntityId" label={hint('Legal Entity', 'Legal entity this trader belongs to — determines regulatory reporting scope and trade booking entity.')} rules={[{ required: true }]}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select legal entity"
              options={(legalEntities ?? []).map((le) => ({ label: `${le.entityCode} — ${le.entityName}`, value: le.legalEntityId }))} />
          </Form.Item>
          <Form.Item name="bookId" label={hint('Trading Desk', 'Desk (top-level book hierarchy node) this trader belongs to. Determines P&L book hierarchy, commodity specialisation, and default approval routing.')} rules={[{ required: true }]}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select trading desk"
              options={deskBooks.map((d) => ({ label: `${d.bookCode} — ${d.bookName}`, value: d.bookId }))} />
          </Form.Item>
          <Form.Item name="commodityTypes" label={hint('Authorised Commodities', 'Commodities this trader is approved to trade. Each commodity gets independent position and trade limits. A trader covering OIL and POWER has two separate limit rows.', 'OIL, POWER')} rules={[{ required: true }]}>
            <Select mode="multiple" options={COMMODITY_TYPE_LOOKUP.map((l) => ({ label: l.label, value: l.lookupId }))} placeholder="Select commodities" />
          </Form.Item>
          <Divider style={{ margin: '12px 0' }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>Approval Chain</Typography.Text></Divider>
          <Form.Item name="approverTraderId" label={hint('Approver Trader', 'Senior trader or desk head who must approve deals exceeding this trader\'s single-trade limit. Must have a higher limit than this trader. Leave blank if no approval required (e.g. senior traders).')}>
            <Select allowClear showSearch optionFilterProp="label" placeholder="Select approver (optional)"
              options={(data ?? []).filter((t) => t.traderId !== editing?.traderId).map((t) => ({ label: `${t.traderCode} — ${t.fullName}`, value: t.traderId }))} />
          </Form.Item>
          <Form.Item name="goLiveDate" label={hint('Go-Live Date', 'Date from which this trader can submit live trades. Before this date the account is in setup mode — limits apply but deals are flagged as paper trades.', '2026-01-15', 'YYYY-MM-DD')}>
            <AppDatePicker />
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
