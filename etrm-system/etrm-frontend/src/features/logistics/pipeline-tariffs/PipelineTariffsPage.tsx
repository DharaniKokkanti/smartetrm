import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, InputNumber, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import dayjs, { type Dayjs } from 'dayjs';
import { usePipelines } from '@features/trade/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useUom } from '@features/reference/uom/hooks';
import { useTableRows } from '@features/tier2/hooks';
import { usePipelineTariffs, useSavePipelineTariff, useDeactivatePipelineTariff } from './hooks';
import { TARIFF_TYPES, CAPACITY_TYPES, TARIFF_SEASONS, type PipelineTariff, type PipelineTariffInput } from './types';

const TYPE_COLOR: Record<string, string> = {
  FIRM: 'blue', INTERRUPTIBLE: 'orange', CAPACITY_BOOKING: 'purple', COMMODITY: 'green', CONNECTION: 'default',
};

export function PipelineTariffsPage() {
  const { data = [], isLoading, refetch } = usePipelineTariffs();
  const save = useSavePipelineTariff();
  const deactivate = useDeactivatePipelineTariff();
  const { data: pipelines = [] } = usePipelines();
  const { data: currencies = [] } = useCurrencies();
  const { data: uoms = [] } = useUom();
  const { data: productRows = [] } = useTableRows<{ productId: number; productCode: string; productName: string }>('product');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PipelineTariff | null>(null);
  const [form] = Form.useForm<PipelineTariffInput>();
  useFormDraft('pipeline-tariffs', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ tariffType: 'FIRM', capacityType: 'ENTRY_EXIT', isActive: true } as unknown as PipelineTariffInput);
    setOpen(true);
  }

  function openEdit(r: PipelineTariff) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      effectiveFrom: r.effectiveFrom ? dayjs(r.effectiveFrom) : undefined,
      effectiveTo: r.effectiveTo ? dayjs(r.effectiveTo) : undefined,
    } as unknown as PipelineTariffInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: PipelineTariffInput = {
      ...values,
      effectiveFrom: v.effectiveFrom ? v.effectiveFrom.format('YYYY-MM-DD') : values.effectiveFrom,
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.tariffId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const pipelineOpts = useMemo(
    () => (pipelines as { pipelineId: number; pipelineCode: string; pipelineName: string }[])
      .map((p) => ({ value: p.pipelineId, label: `${p.pipelineCode} — ${p.pipelineName}` })),
    [pipelines],
  );
  const productOpts = useMemo(
    () => productRows.map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` })),
    [productRows],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[]).map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );
  const uomOpts = useMemo(
    () => (uoms as { uomId: number; uomCode: string }[]).map((u) => ({ value: u.uomId, label: u.uomCode })),
    [uoms],
  );

  const colDefs = useMemo<ColDef<PipelineTariff>[]>(() => [
    { field: 'pipelineName', headerName: 'Pipeline', flex: 1, minWidth: 150, pinned: 'left' },
    { field: 'fromPointCode', headerName: 'From', width: 100, cellClass: 'cell-mono' },
    { field: 'toPointCode', headerName: 'To', width: 100, cellClass: 'cell-mono' },
    { field: 'tariffType', headerName: 'Type', width: 130, cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    {
      headerName: 'Rate', width: 130,
      valueGetter: (p) => `${p.data?.currencyCode} ${p.data?.rate}/${p.data?.rateUomCode}`,
      cellClass: 'cell-mono',
    },
    { field: 'effectiveFrom', headerName: 'Effective', width: 105, cellClass: 'cell-mono' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: PipelineTariff }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this tariff?" onConfirm={() => deactivate.mutate(p.data.tariffId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Pipeline Tariffs"
        description="Access tariffs by pipeline and point pair — firm vs. interruptible capacity pricing, throughput fees, and quality adjustment charges."
        moduleGroup="logistics"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Tariff"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.tariffId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Pipeline Tariff' : 'New Pipeline Tariff'}
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
          <Form.Item name="pipelineId" label="Pipeline" rules={[{ required: true }]}>
            <Select options={pipelineOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="fromPointCode" label="From Point" style={{ width: '50%' }} rules={[{ required: true }]}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="toPointCode" label="To Point" style={{ width: '50%' }} rules={[{ required: true }]}>
              <Input style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="productId" label="Product (blank = all)">
            <Select options={productOpts} allowClear showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="tariffType" label={hint('Tariff Type', 'FIRM = guaranteed capacity, priority in curtailment. INTERRUPTIBLE = can be bumped. CAPACITY_BOOKING = reserved slot regardless of use.')} rules={[{ required: true }]}>
            <Select options={TARIFF_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="capacityType" label={hint('Capacity Type', 'ENTRY/EXIT = one side of an entry-exit gas transport system. ENTRY_EXIT = both. WITHIN_ZONE = capacity that never crosses a zone boundary.')} rules={[{ required: true }]}>
            <Select options={CAPACITY_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Space.Compact block>
            <Form.Item name="rate" label="Rate" style={{ width: '40%' }} rules={[{ required: true }, { type: 'number', min: 0 }]}>
              <InputNumber style={{ width: '100%' }} min={0} precision={6} />
            </Form.Item>
            <Form.Item name="currencyId" label="Currency" style={{ width: '30%' }} rules={[{ required: true }]}>
              <Select options={currencyOpts} />
            </Form.Item>
            <Form.Item name="rateUomId" label="per UoM" style={{ width: '30%' }} rules={[{ required: true }]}>
              <Select options={uomOpts} showSearch optionFilterProp="label" />
            </Form.Item>
          </Space.Compact>
          <Form.Item name="season" label="Season">
            <Select options={TARIFF_SEASONS.map((s) => ({ value: s, label: s }))} allowClear />
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
          <Form.Item name="regulatoryRef" label="Regulatory Reference">
            <Input />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
