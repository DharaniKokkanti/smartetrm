import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, InputNumber } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import dayjs, { type Dayjs } from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { usePriceIndices } from '@features/markets/price-indices/hooks';
import { usePriceSources } from '@features/pricing/price-sources/hooks';
import { usePriceIndexSources, useSavePriceIndexSource, useDeactivatePriceIndexSource } from './hooks';
import { SOURCE_ROLES, type PriceIndexSource, type PriceIndexSourceInput } from './types';

const ROLE_COLOR: Record<string, string> = {
  PRIMARY_MTM: 'blue', SETTLEMENT: 'green', BACKUP: 'orange', REFERENCE: 'default',
};

export function PriceIndexSourcesPage() {
  const { data = [], isLoading, refetch } = usePriceIndexSources();
  const { data: priceIndices = [] } = usePriceIndices();
  const { data: priceSources = [] } = usePriceSources();
  const save = useSavePriceIndexSource();
  const deactivate = useDeactivatePriceIndexSource();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PriceIndexSource | null>(null);
  const [form] = Form.useForm<PriceIndexSourceInput>();
  useFormDraft('price-index-sources', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      sourceRole: 'PRIMARY_MTM', priceMultiplier: 1, priceOffset: 0, calculationSequence: 1, isActive: true,
      effectiveFrom: dayjs() as unknown as string,
    } as unknown as PriceIndexSourceInput);
    setOpen(true);
  }

  function openEdit(r: PriceIndexSource) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      sourceFieldCode: r.sourceFieldCode ?? undefined,
      sourceTicker: r.sourceTicker ?? undefined,
      effectiveFrom: r.effectiveFrom ? dayjs(r.effectiveFrom) : undefined,
      effectiveTo: r.effectiveTo ? dayjs(r.effectiveTo) : undefined,
    } as unknown as PriceIndexSourceInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: PriceIndexSourceInput = {
      ...values,
      effectiveFrom: v.effectiveFrom ? v.effectiveFrom.format('YYYY-MM-DD') : (values.effectiveFrom as unknown as string),
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
    };
    await save.mutateAsync({ id: editing?.pisId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(null);
  }

  const priceIndexOpts = useMemo(
    () => (priceIndices as { priceIndexId: number; indexCode: string; indexName: string }[]).map((i) => ({
      value: i.priceIndexId, label: `${i.indexCode} — ${i.indexName}`,
    })),
    [priceIndices],
  );

  const priceSourceOpts = useMemo(
    () => (priceSources as { priceSourceId: number; sourceCode: string; sourceName: string }[]).map((s) => ({
      value: s.priceSourceId, label: `${s.sourceCode} — ${s.sourceName}`,
    })),
    [priceSources],
  );

  const colDefs = useMemo<ColDef<PriceIndexSource>[]>(() => [
    { field: 'priceIndexCode', headerName: 'Price Index', width: 130, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'priceIndexName', headerName: 'Index Name', flex: 1.2, minWidth: 180 },
    { field: 'sourceCode', headerName: 'Source', width: 120, cellClass: 'cell-mono' },
    { field: 'sourceName', headerName: 'Source Name', flex: 1, minWidth: 160 },
    {
      field: 'sourceRole', headerName: 'Role', width: 130,
      cellRenderer: (p: { value: string }) => <Tag color={ROLE_COLOR[p.value] ?? 'default'}>{p.value.replace('_', ' ')}</Tag>,
    },
    { field: 'sourceFieldCode', headerName: 'Field Code', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'sourceTicker', headerName: 'Ticker', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'priceMultiplier', headerName: 'Multiplier', width: 100, cellClass: 'cell-mono', valueFormatter: (p) => p.value === 1 ? '—' : String(p.value) },
    { field: 'priceOffset', headerName: 'Offset', width: 90, cellClass: 'cell-mono', valueFormatter: (p) => p.value === 0 ? '—' : String(p.value) },
    { field: 'calculationSequence', headerName: 'Seq', width: 70, cellClass: 'cell-mono' },
    { field: 'effectiveFrom', headerName: 'From', width: 105, cellClass: 'cell-mono' },
    { field: 'effectiveTo', headerName: 'To', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PriceIndexSource }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this link?" onConfirm={() => deactivate.mutate(p.data.pisId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Price Index Sources"
        description="Maps each Price Index to the Price Source(s) that feed it — PRIMARY_MTM, SETTLEMENT, BACKUP, or REFERENCE role — with vendor field code/ticker and price multiplier/offset for normalization."
        moduleGroup="pricing"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Index Source Link"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.pisId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Price Index Source' : 'New Price Index Source'}
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
          <Form.Item name="priceIndexId" label="Price Index" rules={[{ required: true }]}>
            <Select options={priceIndexOpts} showSearch optionFilterProp="label" placeholder="Select price index" />
          </Form.Item>
          <Form.Item name="priceSourceId" label="Price Source" rules={[{ required: true }]}>
            <Select options={priceSourceOpts} showSearch optionFilterProp="label" placeholder="Select price source" />
          </Form.Item>
          <Form.Item
            name="sourceRole"
            label={hint('Role', 'PRIMARY_MTM: used every day for mark-to-market. SETTLEMENT: used only at contract expiry (may differ from MTM — e.g. NYMEX settlement vs Bloomberg spot). BACKUP: fallback if primary fails SLA. REFERENCE: cross-check only, not used in calculations.', 'PRIMARY_MTM')}
            rules={[{ required: true }]}
          >
            <Select options={SOURCE_ROLES.map((r) => ({ label: r.replace('_', ' '), value: r }))} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="sourceFieldCode" label={hint('Source Field Code', 'Vendor-specific field/page code for this price. Platts uses mnemonics like PCAAS00 for Dated Brent. Argus uses AP codes. Required for automated price loading.', 'PCAAS00, AAQUA, AP-0001')} style={{ flex: 1 }}>
              <Input placeholder="PCAAS00" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="sourceTicker" label={hint('Source Ticker', 'Bloomberg ticker, Reuters RIC, or exchange contract code. Used when pulling from feed rather than direct vendor API.', 'CO1 (Brent), CL1 (WTI), LMCADY (LME Cu Cash)')} style={{ flex: 1 }}>
              <Input placeholder="CO1" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="priceMultiplier" label={hint('Price Multiplier', 'Multiply raw source price by this factor. Use when source quotes in different units — e.g. source gives price per ton, you need per barrel: multiply by 7.45.', '1.0 (most cases), 7.45 (MT to BBL conversion)')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} step={0.000001} />
            </Form.Item>
            <Form.Item name="priceOffset" label={hint('Price Offset', 'Add this constant to the raw price after multiplier is applied. Used for basis adjustments — e.g. source gives FOB price, you need CIF: add freight component.', '0 (most cases)')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} step={0.01} />
            </Form.Item>
          </Space>
          <Form.Item
            name="calculationSequence"
            label={hint('Calculation Sequence', 'Evaluation order across the multiple source rows for one price index — lets you build a composite/formula index (e.g. sequence 1 = 50% Platts Brent, sequence 2 = 50% Argus Brent, or a base index followed by a differential).', '1 (single-source index), 1 and 2 (two-component composite)')}
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Space style={{ width: '100%', gap: 12 }}>
            <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
            <Form.Item name="effectiveTo" label={hint('Effective To', 'Leave blank for currently active links. Set to end date when switching to a new source — keeps history intact.')} style={{ flex: 1 }}>
              <AppDatePicker />
            </Form.Item>
          </Space>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
