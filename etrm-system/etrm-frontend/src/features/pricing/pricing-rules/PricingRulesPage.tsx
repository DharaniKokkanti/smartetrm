import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber, Divider, Typography } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { usePricingRules, useSavePricingRule, useDeactivatePricingRule } from './hooks';
import { PRICING_TYPES, AVERAGING_METHODS, ROUNDING_RULES, TAS_EXCHANGES, TAS_CONTRACT_SERIES, BALMO_EXCHANGES, BALMO_CONTRACT_SERIES, type PricingRule, type PricingRuleInput, type PricingType } from './types';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';

const TYPE_COLOR: Record<PricingType, string> = {
  FIXED: 'default', FLOATING: 'blue', FORMULA: 'purple', DIFFERENTIAL: 'cyan',
  AVERAGE: 'green', OPTION_STRIKE: 'orange', TAS: 'gold', PLATTS_WINDOW: 'magenta',
  BALMO: 'lime',
};

export function PricingRulesPage() {
  const { data, isLoading, refetch } = usePricingRules();
  const save = useSavePricingRule();
  const deactivate = useDeactivatePricingRule();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PricingRule | null>(null);
  const [pricingType, setPricingType] = useState<PricingType>('FLOATING');
  const [form] = Form.useForm<PricingRuleInput>();
  useFormDraft('pricing-rules', { form, open, setOpen, editing, setEditing });

  function openNew() { setEditing(null); form.resetFields(); form.setFieldsValue({ isActive: true, pricingType: 'FLOATING', rounding: 'ROUND_4DP' }); setPricingType('FLOATING'); setOpen(true); }
  function openEdit(r: PricingRule) {
    setEditing(r);
    form.resetFields();
    form.setFieldsValue({ ruleCode: r.ruleCode, ruleName: r.ruleName, pricingType: r.pricingType, priceIndexCode: r.priceIndexCode ?? undefined, differentialAmount: r.differentialAmount, differentialCurrencyCode: r.differentialCurrencyCode ?? undefined, differentialUomCode: r.differentialUomCode ?? undefined, formulaExpression: r.formulaExpression ?? undefined, averagingMethod: r.averagingMethod ?? undefined, pricingCalendarCode: r.pricingCalendarCode ?? undefined, publicationSource: r.publicationSource ?? undefined, rounding: r.rounding, tasExchange: r.tasExchange ?? undefined, tasContractSeries: r.tasContractSeries ?? undefined, tasTickSize: r.tasTickSize ?? undefined, balmoExchange: r.balmoExchange ?? undefined, balmoSeries: r.balmoSeries ?? undefined, balmoTickSize: r.balmoTickSize ?? undefined, isActive: r.isActive });
    setPricingType(r.pricingType);
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.pricingRuleId ?? null, input: v });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const showIndex = ['FLOATING', 'DIFFERENTIAL', 'AVERAGE', 'PLATTS_WINDOW'].includes(pricingType);
  const showDiff = pricingType === 'DIFFERENTIAL';
  const showFormula = pricingType === 'FORMULA';
  const showTas = pricingType === 'TAS';
  const showBalmo = pricingType === 'BALMO';

  const colDefs = useMemo<ColDef<PricingRule>[]>(() => [
    { field: 'ruleCode', headerName: 'Rule Code', cellClass: 'cell-mono', width: 150, pinned: 'left' },
    { field: 'ruleName', headerName: 'Rule Name', flex: 1.4, minWidth: 200 },
    { field: 'pricingType', headerName: 'Type', width: 140, cellRenderer: (p: { value: PricingType }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'priceIndexCode', headerName: 'Index', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Reference price index — e.g. DTBRT (Platts Dated Brent), WTI-NYMEX, HH-HENRY-HUB, LME-CU-CASH' },
    { field: 'differentialAmount', headerName: 'Differential', width: 120, cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? `${p.value > 0 ? '+' : ''}${p.value} ${p.data?.differentialCurrencyCode ?? ''}/${p.data?.differentialUomCode ?? ''}` : '—',
      tooltipValueGetter: () => 'Differential to index — positive = premium, negative = discount. E.g. Urals crude: DTBRT -2.50 USD/BBL' },
    { field: 'formulaExpression', headerName: 'Formula', flex: 1, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: () => 'Mathematical formula for complex pricing — e.g. (DTBRT + BFOE_DIFF) * 7.45 + FREIGHT - 1.50' },
    { field: 'averagingMethod', headerName: 'Averaging', width: 110, valueFormatter: (p) => p.value ?? '—' },
    { field: 'pricingCalendarCode', headerName: 'Calendar', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'TAS Config', width: 140, cellClass: 'cell-mono',
      valueGetter: (p) =>
        p.data?.pricingType === 'TAS' && p.data.tasContractSeries
          ? `${p.data.tasContractSeries} / tick ${p.data.tasTickSize}`
          : null,
      valueFormatter: (p) => p.value ?? '—',
      tooltipValueGetter: (p) =>
        p.data?.pricingType === 'TAS' ? `Exchange: ${p.data.tasExchange ?? '—'}  Series: ${p.data.tasContractSeries ?? '—'}  Tick: ${p.data.tasTickSize ?? '—'}` : '',
    },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PricingRule }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate pricing rule?" onConfirm={() => deactivate.mutate(p.data.pricingRuleId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Pricing Rules" description="Price determination rules — fixed, floating, differential, formula and Platts window pricing configurations." moduleGroup="pricing" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Pricing Rule" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.pricingRuleId)} />

      <Drawer mask={false} forceRender title={editing ? `Edit Pricing Rule — ${editing.ruleCode}` : 'New Pricing Rule'} open={open} onClose={() => setOpen(false)} width={560}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" onValuesChange={(c) => { if (c.pricingType) setPricingType(c.pricingType as PricingType); }}>
          <Form.Item name="ruleCode" label={hint('Rule Code', 'Unique identifier for this pricing rule. Referenced in contracts and deal capture. Recommendation: prefix by type — FX-DTBRT-M1 (floating Dated Brent monthly), DIFF-WTI-CUSHING (WTI differential).', 'FX-DTBRT-M1, DIFF-WTI-CUSHING')} rules={[{ required: true }]}>
            <Input placeholder="FX-DTBRT-M1" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="ruleName" label="Rule Name" rules={[{ required: true }]}>
            <Input placeholder="Dated Brent Monthly Average Floating" />
          </Form.Item>
          <Form.Item name="pricingType" label={hint('Pricing Type', 'FIXED: locked price. FLOATING: tracks reference index each pricing day. DIFFERENTIAL: index ± spread (common for crude grades vs Brent). FORMULA: complex expression with multiple inputs. AVERAGE: arithmetic/weighted average over pricing period. TAS: Trade at Settlement — priced at exchange settlement. PLATTS_WINDOW: price from Platts Market on Close (MOC) assessment window.', 'FLOATING')} rules={[{ required: true }]}>
            <Select options={PRICING_TYPES.map((t) => ({ label: t.replace(/_/g, ' '), value: t }))} />
          </Form.Item>

          {showIndex && (
            <Form.Item name="priceIndexCode" label={hint('Reference Index', 'Price index code from the Price Indices master data. Common codes: DTBRT (Platts Dated Brent), WTI-NYMEX (NYMEX WTI front month), HH (Henry Hub), LME-CU-CASH (LME Copper Cash), EEX-DE-SPOT (EEX German power).', 'DTBRT, WTI-NYMEX, HH, LME-CU-CASH')} rules={[{ required: showIndex }]}>
              <Input placeholder="DTBRT" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          )}

          {showDiff && (
            <Space style={{ width: '100%', gap: 12 }}>
              <Form.Item name="differentialAmount" label={hint('Differential', 'Premium (+) or discount (-) to the reference index. Example: Urals crude is typically -2.00 to -3.00 USD/BBL vs Dated Brent depending on market conditions.', '-2.50')} style={{ flex: 1 }} rules={[{ required: showDiff }]}>
                <InputNumber style={{ width: '100%' }} step={0.01} placeholder="-2.50" />
              </Form.Item>
              <Form.Item name="differentialCurrencyCode" label="Currency" style={{ flex: 1 }}>
                <Input placeholder="USD" maxLength={3} style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
              </Form.Item>
              <Form.Item name="differentialUomCode" label="UoM" style={{ flex: 1 }}>
                <Input placeholder="BBL" style={{ fontFamily: 'monospace' }} />
              </Form.Item>
            </Space>
          )}

          {showFormula && (
            <Form.Item name="formulaExpression" label={hint('Formula Expression', 'Mathematical formula using index codes as variables. Operators: +, -, *, /, (, ). Index codes must match Price Indices master data. Example: (DTBRT + BFOE_DIFF) * 7.45 + FREIGHT - 1.50. For conditional pricing use IF() syntax.', '(DTBRT + BFOE_DIFF) * 7.45')} rules={[{ required: showFormula }]}>
              <Input.TextArea rows={3} style={{ fontFamily: 'monospace' }} placeholder="(DTBRT + BFOE_DIFF) * 7.45 + FREIGHT - 1.50" />
            </Form.Item>
          )}

          {showTas && (
            <>
              <Divider orientation="left" style={{ margin: '12px 0 8px', fontSize: 11 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>TAS Configuration</Typography.Text>
              </Divider>
              <Space style={{ width: '100%', gap: 12 }}>
                <Form.Item name="tasExchange" label={hint('Exchange', 'Exchange where settlement price is published. CME_NYMEX: WTI CL, NG, HO, RB. ICE_EUROPE: Brent BZ, Gasoil.', 'CME_NYMEX')} style={{ flex: 1 }} rules={[{ required: showTas }]}>
                  <Select options={TAS_EXCHANGES.map((e) => ({ value: e, label: e.replace(/_/g, ' ') }))} placeholder="CME_NYMEX" />
                </Form.Item>
                <Form.Item name="tasContractSeries" label={hint('Contract Series', 'Futures product family. CL = WTI Crude, NG = Natural Gas, HO = Heating Oil, RB = RBOB Gasoline, BZ = ICE Brent.', 'CL')} style={{ flex: 1 }} rules={[{ required: showTas }]}>
                  <Select options={TAS_CONTRACT_SERIES.map((s) => ({ value: s, label: s }))} placeholder="CL" />
                </Form.Item>
                <Form.Item name="tasTickSize" label={hint('Tick Size', 'Minimum price movement in USD per unit. CL: $0.01/bbl. NG: $0.001/mmbtu. HO/RB: $0.0001/gal. BZ: $0.01/bbl.', '0.01')} style={{ flex: 1 }} rules={[{ required: showTas }]}>
                  <InputNumber style={{ width: '100%' }} precision={6} step={0.001} placeholder="0.01" min={0.0001} />
                </Form.Item>
              </Space>
            </>
          )}

          {showBalmo && (
            <>
              <Divider orientation="left" style={{ margin: '12px 0 8px', fontSize: 11 }}>
                <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>BALMO Configuration</Typography.Text>
              </Divider>
              <Space style={{ width: '100%', gap: 12 }}>
                <Form.Item name="balmoExchange" label={hint('Exchange', 'Exchange listing the BALMO contract. CME_NYMEX: WTI CL BALMO (J42), NG BALMO. ICE_EUROPE: Brent BALMO, Gasoil BALMO.', 'CME_NYMEX')} style={{ flex: 1 }} rules={[{ required: showBalmo }]}>
                  <Select options={BALMO_EXCHANGES.map((e) => ({ value: e, label: e.replace(/_/g, ' ') }))} placeholder="CME_NYMEX" />
                </Form.Item>
                <Form.Item name="balmoSeries" label={hint('Contract Series', 'Underlying futures family for daily settlement. CL = WTI BALMO, BZ = ICE Brent BALMO, HO = Heating Oil BALMO, NG = Henry Hub BALMO.', 'CL')} style={{ flex: 1 }} rules={[{ required: showBalmo }]}>
                  <Select options={BALMO_CONTRACT_SERIES.map((s) => ({ value: s, label: s }))} placeholder="CL" />
                </Form.Item>
                <Form.Item name="balmoTickSize" label={hint('Tick Size', 'Minimum price movement — same as the underlying futures. CL: $0.01/bbl. NG: $0.001/mmbtu. HO/RB: $0.0001/gal. BZ: $0.01/bbl.', '0.01')} style={{ flex: 1 }} rules={[{ required: showBalmo }]}>
                  <InputNumber style={{ width: '100%' }} precision={6} step={0.001} placeholder="0.01" min={0.0001} />
                </Form.Item>
              </Space>
            </>
          )}

          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="averagingMethod" label={hint('Averaging Method', 'ARITHMETIC: simple daily average over pricing period (most common). WEIGHTED: volume-weighted average (VWAP). ASIAN: path-dependent average — used in Asian options.', 'ARITHMETIC')} style={{ flex: 1 }}>
              <Select allowClear placeholder="None (single fix)" options={AVERAGING_METHODS.map((m) => ({ label: m, value: m }))} />
            </Form.Item>
            <Form.Item name="pricingCalendarCode" label={hint('Pricing Calendar', 'Business day calendar determining valid pricing days. Only non-holiday days count toward the average.', 'LON, NYC, LME')} style={{ flex: 1 }}>
              <Input placeholder="LON" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="publicationSource" label={hint('Publication Source', 'PRA (Price Reporting Agency) or exchange that publishes the reference price. PLATTS, ARGUS, ICE, NYMEX, LME. Used for dispute resolution — the publication is the primary evidence.', 'PLATTS, ARGUS, LME')} style={{ flex: 1 }}>
              <Input placeholder="PLATTS" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="rounding" label={hint('Rounding', 'Price rounding precision. Most crude oil: 4 decimal places (USD/BBL). Natural gas: 3-4 dp. Power: 2 dp (USD/MWh). LME metals: 0-2 dp depending on grade.', 'ROUND_4DP')} style={{ flex: 1 }}>
              <Select options={ROUNDING_RULES.map((r) => ({ label: r, value: r }))} />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
