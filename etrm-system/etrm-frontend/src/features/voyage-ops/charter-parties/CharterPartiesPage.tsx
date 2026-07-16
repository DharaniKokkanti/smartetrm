import { useMemo, useState } from 'react';
import { Button, Drawer, Form, Input, Select, DatePicker, InputNumber, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { useVessels } from '@features/logistics/vessels/hooks';
import { useLocations } from '@features/logistics/locations/hooks';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { useCharterParties, useSaveCharterParty } from './hooks';
import {
  CHARTER_DIRECTIONS, CHARTER_PARTY_STATUSES, HIRE_PAYMENT_FREQUENCIES, FREIGHT_RATE_BASES, BUNKER_CLAUSE_BASES,
  type CharterParty, type CharterPartyInput, type CharterPartyStatus,
} from './types';

const STATUS_COLOR: Record<CharterPartyStatus, string> = {
  ON_SUBS: 'default', FIXED: 'processing', CANCELLED: 'error', COMPLETED: 'success',
};

export function CharterPartiesPage() {
  const { data, isLoading, refetch } = useCharterParties();
  const save = useSaveCharterParty();
  const { data: vessels = [] } = useVessels();
  const { data: locations = [] } = useLocations();
  const { data: counterparties = [] } = useCounterparties();
  const { data: currencies = [] } = useCurrencies();
  const { data: cpTypes = [] } = useTableRows('charter_party_type');
  const { data: laytimeTerms = [] } = useTableRows('laytime_term_template');
  const { data: cpTemplates = [] } = useTableRows('charter_party_template');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CharterParty | null>(null);
  const [form] = Form.useForm<CharterPartyInput>();

  const vesselOptions = vessels.map((v) => ({ value: v.vesselId, label: v.vesselName }));
  const locationOptions = locations.map((l) => ({ value: l.locationId, label: l.locationName }));
  const counterpartyOptions = counterparties.map((c) => ({ value: c.counterpartyId, label: c.legalName }));
  const currencyOptions = currencies.map((c) => ({ value: c.currencyId, label: c.currencyCode }));
  const cpTypeOptions = (cpTypes as { charterPartyTypeId: number; typeCode: string }[]).map((t) => ({ value: t.charterPartyTypeId, label: t.typeCode }));
  const laytimeTermOptions = (laytimeTerms as { laytimeTermId: number; termCode: string }[]).map((t) => ({ value: t.laytimeTermId, label: t.termCode }));
  type CpTemplate = {
    templateId: number; templateCode: string; defaultLaytimeTermId: number | null;
    defaultDemurrageRatePerDay: number | null; defaultDispatchRatePerDay: number | null;
    defaultBunkerClauseBasis: string | null; defaultBunkerClauseTolerancePct: number | null;
    defaultHirePaymentFrequency: string | null;
  };
  const cpTemplateOptions = (cpTemplates as CpTemplate[]).map((t) => ({ value: t.templateId, label: t.templateCode }));

  // Fills in the template's defaults only where the corresponding field is currently empty —
  // never clobbers a value the user already typed.
  function applyTemplateDefaults(templateId: number) {
    const template = (cpTemplates as CpTemplate[]).find((t) => t.templateId === templateId);
    if (!template) return;
    const current = form.getFieldsValue();
    const patch: Record<string, unknown> = {};
    if (current.laytimeTermId == null && template.defaultLaytimeTermId != null) patch.laytimeTermId = template.defaultLaytimeTermId;
    if (current.demurrageRatePerDay == null && template.defaultDemurrageRatePerDay != null) patch.demurrageRatePerDay = template.defaultDemurrageRatePerDay;
    if (current.dispatchRatePerDay == null && template.defaultDispatchRatePerDay != null) patch.dispatchRatePerDay = template.defaultDispatchRatePerDay;
    if (current.bunkerClauseBasis == null && template.defaultBunkerClauseBasis != null) patch.bunkerClauseBasis = template.defaultBunkerClauseBasis;
    if (current.bunkerClauseTolerancePct == null && template.defaultBunkerClauseTolerancePct != null) patch.bunkerClauseTolerancePct = template.defaultBunkerClauseTolerancePct;
    if (current.hirePaymentFrequency == null && template.defaultHirePaymentFrequency != null) patch.hirePaymentFrequency = template.defaultHirePaymentFrequency;
    if (Object.keys(patch).length > 0) form.setFieldsValue(patch);
  }

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldValue('status', 'ON_SUBS');
    form.setFieldValue('direction', 'CHARTER_IN');
    form.setFieldValue('isActive', true);
    setOpen(true);
  }

  function openEdit(cp: CharterParty) {
    setEditing(cp);
    form.setFieldsValue({
      cpReference: cp.cpReference, charterPartyTypeId: cp.charterPartyTypeId, vesselId: cp.vesselId,
      counterpartyId: cp.counterpartyId, direction: cp.direction,
      hireRate: cp.hireRate ?? undefined, hireCurrencyId: cp.hireCurrencyId ?? undefined, hirePaymentFrequency: cp.hirePaymentFrequency ?? undefined,
      freightRate: cp.freightRate ?? undefined, freightRateBasis: cp.freightRateBasis ?? undefined,
      laytimeTermId: cp.laytimeTermId ?? undefined, demurrageRatePerDay: cp.demurrageRatePerDay ?? undefined, dispatchRatePerDay: cp.dispatchRatePerDay ?? undefined,
      deliveryLocationId: cp.deliveryLocationId ?? undefined, redeliveryLocationId: cp.redeliveryLocationId ?? undefined,
      deliveryDate: cp.deliveryDate ? (dayjs(cp.deliveryDate) as unknown as string) : undefined,
      redeliveryDateEstimate: cp.redeliveryDateEstimate ? (dayjs(cp.redeliveryDateEstimate) as unknown as string) : undefined,
      bunkerClauseBasis: cp.bunkerClauseBasis ?? undefined, bunkerClauseTolerancePct: cp.bunkerClauseTolerancePct ?? undefined,
      optionPeriodMonths: cp.optionPeriodMonths ?? undefined, status: cp.status, notes: cp.notes ?? undefined, isActive: cp.isActive,
      charterPartyTemplateId: cp.charterPartyTemplateId ?? undefined,
    });
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    const input: CharterPartyInput = {
      ...v,
      deliveryDate: v.deliveryDate ? dayjs(v.deliveryDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
      redeliveryDateEstimate: v.redeliveryDateEstimate ? dayjs(v.redeliveryDateEstimate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    };
    await save.mutateAsync({ id: editing?.charterPartyId ?? null, input });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<CharterParty>[]>(() => [
    { field: 'cpReference', headerName: 'CP Reference', width: 150, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'charterPartyTypeCode', headerName: 'Type', width: 110, valueFormatter: (p) => p.value ?? '—' },
    { field: 'vesselName', headerName: 'Vessel', flex: 1, minWidth: 150 },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 160 },
    { field: 'direction', headerName: 'Direction', width: 120, cellRenderer: (p: { value: string }) => <Tag color={p.value === 'CHARTER_IN' ? 'blue' : 'orange'}>{p.value.replace('_', ' ')}</Tag> },
    { field: 'status', headerName: 'Status', width: 110, cellRenderer: (p: { value: CharterPartyStatus }) => <Tag color={STATUS_COLOR[p.value]}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'hireRate', headerName: 'Hire Rate', width: 110, valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '—' },
    { field: 'demurrageRatePerDay', headerName: 'Demurrage/Day', width: 130, valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '—' },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 60, sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<CharterParty>) => (
        <Button size="small" type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); if (p.data) openEdit(p.data); }} />
      ),
    },
  ], []);

  return (
    <div>
      <PageHeader title="Charter Parties" description="Real fixtures — charter-in/out terms, hire/freight, laytime, delivery/redelivery, and bunker clauses. Open a row for off-hire events." moduleGroup="Freight & Shipping" />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Charter Party"
        onRefresh={() => void refetch()}
        getRowId={(p) => String(p.data.charterPartyId)}
        onRowClicked={(e) => { if (e.data) navigate(`/voyage-ops/charter-parties/${e.data.charterPartyId}`); }}
      />
      <Drawer title={editing ? `Edit ${editing.cpReference}` : 'New Charter Party'} open={open} onClose={() => setOpen(false)} width={520}
        extra={<Button type="primary" onClick={() => void submit()} loading={save.isPending}>Save</Button>}>
        <Form form={form} layout="vertical">
          <Form.Item name="cpReference" label="CP Reference" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="charterPartyTypeId" label="Charter Party Type" rules={[{ required: true }]}><Select options={cpTypeOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="charterPartyTemplateId" label="Charter Party Template (fills in defaults below where left blank)">
            <Select allowClear showSearch optionFilterProp="label" options={cpTemplateOptions} onChange={(id: number | undefined) => { if (id != null) applyTemplateDefaults(id); }} />
          </Form.Item>
          <Form.Item name="vesselId" label="Vessel" rules={[{ required: true }]}><Select options={vesselOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="counterpartyId" label="Counterparty" rules={[{ required: true }]}><Select options={counterpartyOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="direction" label="Direction" rules={[{ required: true }]}>
            <Select options={CHARTER_DIRECTIONS.map((d) => ({ value: d, label: d.replace('_', ' ') }))} />
          </Form.Item>
          <Form.Item name="status" label="Status" rules={[{ required: true }]}>
            <Select options={CHARTER_PARTY_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="hireRate" label="Hire Rate (per day)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="hireCurrencyId" label="Hire Currency"><Select allowClear options={currencyOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="hirePaymentFrequency" label="Hire Payment Frequency">
            <Select allowClear options={HIRE_PAYMENT_FREQUENCIES.map((f) => ({ value: f, label: f.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="freightRate" label="Freight Rate"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="freightRateBasis" label="Freight Rate Basis">
            <Select allowClear options={FREIGHT_RATE_BASES.map((b) => ({ value: b, label: b.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="laytimeTermId" label="Laytime Term"><Select allowClear options={laytimeTermOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="demurrageRatePerDay" label="Demurrage Rate/Day"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="dispatchRatePerDay" label="Dispatch Rate/Day"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="deliveryLocationId" label="Delivery Location"><Select allowClear options={locationOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="redeliveryLocationId" label="Redelivery Location"><Select allowClear options={locationOptions} showSearch optionFilterProp="label" /></Form.Item>
          <Form.Item name="deliveryDate" label="Delivery Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="redeliveryDateEstimate" label="Redelivery Date (Estimate)"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="bunkerClauseBasis" label="Bunker Clause Basis">
            <Select allowClear options={BUNKER_CLAUSE_BASES.map((b) => ({ value: b, label: b.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="bunkerClauseTolerancePct" label="Bunker Clause Tolerance (%)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="optionPeriodMonths" label="Option Period (months)"><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="isActive" hidden initialValue={true}><Input /></Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
