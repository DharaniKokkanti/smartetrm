import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { ExpiryBadge } from '@components/smart/ExpiryBadge';
import { hint } from '@components/smart/FieldHint';
import { useVessels, useSaveVessel, useDeactivateVessel } from './hooks';
import { VESSEL_TYPES, VESSEL_STATUS_CODES, type Vessel, type VesselInput, type VesselType, type VesselStatusCode } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { useCountries } from '@features/reference/countries/hooks';
import { useTableRows } from '@features/tier2/hooks';

const TYPE_COLOR: Record<VesselType, string> = {
  VLCC: 'blue', SUEZMAX: 'geekblue', AFRAMAX: 'purple', PANAMAX: 'cyan',
  MR: 'teal', HANDYSIZE: 'lime', LNG_CARRIER: 'gold', LPG_CARRIER: 'orange',
  PRODUCT_TANKER: 'green', CHEMICAL_TANKER: 'volcano', BULK_CARRIER: 'brown',
  BUNKER_VESSEL: 'default', FSRU: 'magenta', FPSO: 'red',
};

const STATUS_COLOR: Record<VesselStatusCode, string> = {
  ACTIVE: 'success', ON_CHARTER: 'processing', IN_DRYDOCK: 'warning',
  IDLE: 'default', SCRAPPED: 'error', BLACKLISTED: 'error',
};

export function VesselsPage() {
  const { data, isLoading, refetch } = useVessels();
  const save = useSaveVessel();
  const deactivate = useDeactivateVessel();
  const { data: countries = [] } = useCountries();
  const countryOptions = countries.map((c) => ({ value: c.countryId, label: `${c.countryCode} — ${c.countryName}` }));
  const countryLabelById = new Map(countries.map((c) => [c.countryId, `${c.countryCode} — ${c.countryName}`]));
  const { data: fleets = [] } = useTableRows('fleet');
  const fleetOptions = (fleets as { fleetId: number; fleetName: string }[]).map((f) => ({ value: f.fleetId, label: f.fleetName }));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Vessel | null>(null);
  const [form] = Form.useForm<VesselInput>();
  useFormDraft('logistics-vessels', { form, open, setOpen, editing, setEditing });
  const watchedVesselType = Form.useWatch('vesselType', form);

  function openNew() { setEditing(null); form.resetFields(); form.setFieldValue('isActive', true); form.setFieldValue('statusCode', 'ACTIVE'); setOpen(true); }
  function openEdit(v: Vessel) {
    setEditing(v);
    form.setFieldsValue({
      imoNumber: v.imoNumber, vesselName: v.vesselName, vesselType: v.vesselType, dwt: v.dwt,
      grossTonnage: v.grossTonnage, buildYear: v.buildYear, flagCountryId: v.flagCountryId, buildCountryId: v.buildCountryId ?? undefined, owner: v.owner ?? undefined,
      operator: v.operator ?? undefined, classificationSociety: v.classificationSociety ?? undefined,
      vettingExpiry: v.vettingExpiry ? (dayjs(v.vettingExpiry) as unknown as string) : undefined,
      sireInspectionDate: v.sireInspectionDate ? (dayjs(v.sireInspectionDate) as unknown as string) : undefined,
      cdiBerthStatus: v.cdiBerthStatus ?? undefined, statusCode: v.statusCode, isActive: v.isActive,
      grainCapacityCbm: v.grainCapacityCbm ?? undefined, baleCapacityCbm: v.baleCapacityCbm ?? undefined,
      guaranteedBoilOffRatePctPerDay: v.guaranteedBoilOffRatePctPerDay ?? undefined, heelCapacityCbm: v.heelCapacityCbm ?? undefined,
      fleetId: v.fleetId ?? undefined,
    });
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const input: VesselInput = {
      ...v,
      vettingExpiry: v.vettingExpiry ? dayjs(v.vettingExpiry as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
      sireInspectionDate: v.sireInspectionDate ? dayjs(v.sireInspectionDate as unknown as dayjs.Dayjs).format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.vesselId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<Vessel>[]>(() => [
    { field: 'imoNumber', headerName: 'IMO', cellClass: 'cell-mono', width: 110, pinned: 'left',
      tooltipValueGetter: () => 'IMO number — permanent 7-digit vessel identifier assigned by Lloyd\'s Register. Never changes even if vessel is renamed or re-flagged.' },
    { field: 'vesselName', headerName: 'Vessel', flex: 1.3, minWidth: 180 },
    { field: 'vesselType', headerName: 'Type', width: 140, cellRenderer: (p: { value: VesselType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'dwt', headerName: 'DWT (MT)', width: 115, cellClass: 'cell-mono', valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '—',
      tooltipValueGetter: () => 'Deadweight Tonnage — maximum cargo carrying capacity in metric tons. VLCC: 250,000-320,000 DWT. Aframax: 80,000-120,000 DWT.' },
    { field: 'flagCountryId', headerName: 'Flag', width: 130, valueFormatter: (p) => countryLabelById.get(p.value) ?? String(p.value) },
    { field: 'classificationSociety', headerName: 'Class', width: 120, valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Classification society certifying vessel seaworthiness: LR (Lloyd\'s Register), DNV, Bureau Veritas, ABS, ClassNK, RINA' },
    { field: 'vettingExpiry', headerName: 'Vetting Expiry', width: 160,
      cellRenderer: (p: { value: string | null }) => p.value ? <ExpiryBadge expiryDate={p.value} /> : <Tag color="default">—</Tag> },
    { field: 'statusCode', headerName: 'Status', width: 120,
      cellRenderer: (p: { value: VesselStatusCode }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'isActive', headerName: 'Active', width: 90, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Vessel }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate vessel?" onConfirm={() => deactivate.mutate(p.data.vesselId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate, countryLabelById]);

  return (
    <>
      <PageHeader title="Vessels" description="Approved vessel register — tankers, LNG carriers, FPSOs. Vetting expiry tracking with alerts for upcoming inspections." moduleGroup="logistics" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Vessel" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.vesselId)} />

      <Drawer mask={false} forceRender title={editing ? `Edit Vessel — ${editing.imoNumber}` : 'New Vessel'} open={open} onClose={() => setOpen(false)} width={560}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="imoNumber" label={hint('IMO Number', 'International Maritime Organization vessel identifier — permanent 7-digit number prefixed "IMO". Assigned by Lloyd\'s Register. Never changes on rename or re-flagging. MARPOL 73/78 requires display on hull.', 'IMO 9741060', 'IMO NNNNNNN')} rules={[{ required: true, pattern: /^IMO\s?\d{7}$/, message: 'Format: IMO 9741060' }]} style={{ flex: 1 }}>
              <Input placeholder="IMO 9741060" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="buildYear" label={hint('Build Year', 'Year the vessel was delivered from the shipyard. Affects vessel age calculations used in vetting criteria (many majors reject vessels >20-25 years old for crude, >15 years for clean products).', '2018')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="2018" min={1960} max={2030} />
            </Form.Item>
          </Space>
          <Form.Item name="vesselName" label={hint('Vessel Name', 'Current registered vessel name. Vessels may be renamed — IMO number is the permanent identity.', 'NORDIC LUNA')} rules={[{ required: true }]}>
            <Input placeholder="NORDIC LUNA" />
          </Form.Item>
          <Form.Item name="vesselType" label={hint('Vessel Type', 'VLCC: >200,000 DWT crude. SUEZMAX: 120,000-200,000 DWT. AFRAMAX: 80,000-120,000 DWT (North Sea, Med). MR: 25,000-55,000 DWT clean products. LNG_CARRIER: cryogenic LNG. FPSO: floating production storage offloading.', 'VLCC')} rules={[{ required: true }]}>
            <Select options={VESSEL_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="dwt" label={hint('DWT (MT)', 'Deadweight Tonnage in metric tons — total cargo + fuel + water + crew. VLCC range: 250,000-320,000 MT. This drives cargo quantity planning and freight calculations.', '300000')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="300000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="grossTonnage" label={hint('Gross Tonnage', 'Internal volume of all enclosed spaces in GT — used for port dues and canal transit fees (Suez, Panama).', '160000')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="160000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Space>
          {watchedVesselType === 'BULK_CARRIER' && (
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item name="grainCapacityCbm" label={hint('Grain Capacity (CBM)', 'Cargo hold capacity for free-flowing dry-bulk cargo (grain, most ores) — determines whether the vessel can lift the contractual metals/agri cargo quantity.', '198000')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="198000" />
              </Form.Item>
              <Form.Item name="baleCapacityCbm" label={hint('Bale Capacity (CBM)', 'Cargo hold capacity for packed/bagged dry-bulk cargo — always less than or equal to grain capacity.', '189500')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="189500" />
              </Form.Item>
            </Space>
          )}
          {watchedVesselType === 'LNG_CARRIER' && (
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item
                name="guaranteedBoilOffRatePctPerDay"
                label={hint('Guaranteed Boil-Off Rate (%/day)', 'Contractually guaranteed maximum daily boil-off rate — typically around 0.10-0.15%/day for modern LNG carriers. Drives BOG allowance in the charter party.', '0.10')}
                style={{ flex: 1 }}
                rules={[{ type: 'number', min: 0, max: 5, message: 'Must be between 0 and 5%/day' }]}
              >
                <InputNumber style={{ width: '100%' }} step={0.01} min={0} max={5} placeholder="0.10" />
              </Form.Item>
              <Form.Item name="heelCapacityCbm" label={hint('Heel Capacity (CBM)', 'Minimum LNG volume retained on board between voyages to keep cargo tanks cold and avoid a full re-cooldown before the next loading.', '3000')} style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} placeholder="3000" />
              </Form.Item>
            </Space>
          )}
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="flagCountryId" label={hint('Flag State', 'Country of vessel registry. Determines which maritime law governs the vessel. Common flags: Liberia, Marshall Islands, Panama, Bahamas.', 'LR')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={countryOptions} showSearch optionFilterProp="label" placeholder="Select flag state" />
            </Form.Item>
            <Form.Item name="buildCountryId" label={hint('Build Country', 'Country where the vessel was constructed — recorded from the shipyard, not the flag state.', 'JP')} style={{ flex: 1 }}>
              <Select options={countryOptions} showSearch optionFilterProp="label" allowClear placeholder="Select build country" />
            </Form.Item>
          </Space>
          <Form.Item name="classificationSociety" label={hint('Classification Society', 'Technical body that certifies vessel structural integrity and equipment. IACS members: LR (Lloyd\'s Register), DNV (Det Norske Veritas), BV (Bureau Veritas), ABS, ClassNK, RINA. Required for vetting approval.', 'DNV')}>
            <Input placeholder="DNV" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="owner" label={hint('Owner', 'Registered shipowner (legal owner). May differ from commercial operator — important for sanctions screening.', 'Nordic Tankers AS')}>
            <Input placeholder="Shipowner name" />
          </Form.Item>
          <Form.Item name="operator" label={hint('Operator', 'Commercial operator managing vessel employment. This is the entity you charter the vessel from or to. May be the same as owner for single-ship companies.', 'Scorpio Tankers Inc.')}>
            <Input placeholder="Operator name" />
          </Form.Item>
          <Form.Item name="fleetId" label={hint('Fleet', 'Which fleet this vessel is grouped under, for portfolio-level reporting and management.')}>
            <Select allowClear showSearch optionFilterProp="label" options={fleetOptions} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="vettingExpiry" label={hint('Vetting Expiry', 'Date after which the vessel is not approved for loading at company-controlled terminals. SIRE (tankers) and CDI (chemicals) inspections typically valid 6-12 months. A vessel with expired vetting cannot load — trigger re-inspection 60 days before expiry.', '2026-12-31')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="sireInspectionDate" label={hint('Last SIRE Date', 'Date of the most recent Ship Inspection Report Programme inspection. OCIMF SIRE reports are shared between oil majors and used as primary vetting evidence. A fresh SIRE (<3 months) significantly speeds up vetting approval.', '2025-06-15')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Form.Item name="cdiBerthStatus" label={hint('CDI/Berth Status', 'Chemical Distribution Institute approval for chemical tankers, or terminal berth approval status. Some terminals maintain an approved vessel list — CDI/berth status indicates standing on that list.', 'APPROVED, CONDITIONAL, REJECTED')}>
            <Input placeholder="APPROVED" />
          </Form.Item>
          <Form.Item name="statusCode" label={hint('Vessel Status', 'ACTIVE: approved and available. ON_CHARTER: currently on time charter. IN_DRYDOCK: under maintenance/survey. IDLE: available but not employed. BLACKLISTED: prohibited — sanctions, safety, or vetting failures.')} rules={[{ required: true }]}>
            <Select options={VESSEL_STATUS_CODES.map((s) => ({ label: s.replace(/_/g, ' '), value: s }))} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
