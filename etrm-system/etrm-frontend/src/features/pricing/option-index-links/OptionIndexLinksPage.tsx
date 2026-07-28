import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { usePriceIndices } from '@features/markets/price-indices/hooks';
import { useOptionIndexLinks, useSaveOptionIndexLink, useDeactivateOptionIndexLink } from './hooks';
import { PRICING_MODELS, type OptionIndexLink, type OptionIndexLinkInput } from './types';

const MODEL_COLOR: Record<string, string> = {
  BLACK_76: 'blue', GARMAN_KOHLHAGEN: 'purple', SABR: 'orange', BACHELIER: 'cyan', SHIFTED_LOGNORMAL: 'gold',
};

export function OptionIndexLinksPage() {
  const { data = [], isLoading, refetch } = useOptionIndexLinks();
  const { data: priceIndices = [] } = usePriceIndices();
  const save = useSaveOptionIndexLink();
  const deactivate = useDeactivateOptionIndexLink();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<OptionIndexLink | null>(null);
  const [form] = Form.useForm<OptionIndexLinkInput>();
  useFormDraft('option-index-links', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ pricingModel: 'BLACK_76', isActive: true } as unknown as OptionIndexLinkInput);
    setOpen(true);
  }

  function openEdit(r: OptionIndexLink) {
    setEditing(r);
    form.setFieldsValue({ ...r, notes: r.notes ?? undefined } as unknown as OptionIndexLinkInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const input: OptionIndexLinkInput = { ...values, notes: values.notes ?? null };
    await save.mutateAsync({ id: editing?.optionIndexLinkId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(null);
  }

  const priceIndexOpts = useMemo(
    () => (priceIndices as { priceIndexId: number; indexCode: string; indexName: string }[]).map((i) => ({
      value: i.priceIndexId, label: `${i.indexCode} — ${i.indexName}`,
    })),
    [priceIndices],
  );

  const colDefs = useMemo<ColDef<OptionIndexLink>[]>(() => [
    { field: 'optionIndexCode', headerName: 'Option Index', width: 150, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'optionIndexName', headerName: 'Option Index Name', flex: 1, minWidth: 160 },
    { field: 'underlyingIndexCode', headerName: 'Underlying', width: 150, cellClass: 'cell-mono' },
    { field: 'underlyingIndexName', headerName: 'Underlying Name', flex: 1, minWidth: 160 },
    {
      field: 'pricingModel', headerName: 'Model', width: 160,
      cellRenderer: (p: { value: string }) => <Tag color={MODEL_COLOR[p.value] ?? 'default'}>{p.value.replace(/_/g, ' ')}</Tag>,
    },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: OptionIndexLink }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this option index link?" onConfirm={() => deactivate.mutate(p.data.optionIndexLinkId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Option Index Links"
        description="Links an option index to the underlying linear index its forward price comes from, and the pricing model that values it — BLACK_76 for standard commodity futures options, GARMAN_KOHLHAGEN for FX-style options, SABR/SHIFTED_LOGNORMAL where negative underlying prices are possible (power, some gas markets)."
        moduleGroup="pricing"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Option Index Link"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.optionIndexLinkId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Option Index Link' : 'New Option Index Link'}
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
          <Form.Item name="optionPriceIndexId" label={hint('Option Index', 'The option index itself — a normal Price Index row representing the option series (e.g. NYMEX WTI Options).')} rules={[{ required: true }]}>
            <Select options={priceIndexOpts} showSearch optionFilterProp="label" placeholder="Select option price index" />
          </Form.Item>
          <Form.Item name="underlyingPriceIndexId" label={hint('Underlying Index', 'The linear (futures/swap) index the pricing model reads the forward price from.')} rules={[{ required: true }]}>
            <Select options={priceIndexOpts} showSearch optionFilterProp="label" placeholder="Select underlying price index" />
          </Form.Item>
          <Form.Item
            name="pricingModel"
            label={hint('Pricing Model', 'BLACK_76: standard commodity futures options. GARMAN_KOHLHAGEN: FX-style options. SABR / SHIFTED_LOGNORMAL: markets where the underlying can go negative (power, some gas). BACHELIER: normal-model options, also used for negative-price-capable underlyings.')}
            rules={[{ required: true }]}
          >
            <Select options={PRICING_MODELS.map((m) => ({ label: m.replace(/_/g, ' '), value: m }))} />
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
