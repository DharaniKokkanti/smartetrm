import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch, Tooltip } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useTableRows } from '@features/tier2/hooks';
import { useEmissionSchemes } from '@features/environmental/emission-schemes/hooks';
import { useCarbonRegistries } from '@features/environmental/carbon-registries/hooks';
import { useEnvironmentalProducts, useSaveEnvironmentalProduct, useDeactivateEnvironmentalProduct } from './hooks';
import type { EnvironmentalProduct, EnvironmentalProductInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const PRODUCT_TYPE_COLOR: Record<string, string> = { ALLOWANCE: 'blue', CERTIFICATE: 'green', OFFSET: 'orange' };

export function EnvironmentalProductsPage() {
  const { data = [], isLoading, refetch } = useEnvironmentalProducts();
  const save       = useSaveEnvironmentalProduct();
  const deactivate = useDeactivateEnvironmentalProduct();
  const { data: schemes = [] }   = useEmissionSchemes();
  const { data: registries = [] } = useCarbonRegistries();
  const { data: productTypeRows = [] } = useTableRows<{ typeCode: string; typeName: string }>('environmental_product_type');
  const productTypeOpts = productTypeRows.map((r) => ({ value: r.typeCode, label: r.typeName }));

  const schemeOpts = useMemo(
    () => (schemes as { schemeId: number; schemeCode: string; schemeName: string }[])
      .filter((s) => s.schemeId)
      .map((s) => ({ value: s.schemeId, label: `${s.schemeCode} — ${s.schemeName}` })),
    [schemes],
  );
  const registryOpts = useMemo(
    () => (registries as { registryId: number; registryCode: string; registryName: string }[])
      .filter((r) => r.registryId)
      .map((r) => ({ value: r.registryId, label: `${r.registryCode} — ${r.registryName}` })),
    [registries],
  );

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<EnvironmentalProduct | null>(null);
  const [form]                = Form.useForm<EnvironmentalProductInput>();
  useFormDraft('env-products', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null); form.resetFields();
    form.setFieldsValue({ productType: 'ALLOWANCE', unitOfMeasure: 'tCO2e', isActive: true });
    setOpen(true);
  }
  function openEdit(r: EnvironmentalProduct) {
    setEditing(r);
    form.setFieldsValue({ ...r, schemeId: r.schemeId ?? undefined, registryId: r.registryId ?? undefined, description: r.description ?? undefined });
    setOpen(true);
  }
  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.productId ?? null, input: { ...v, schemeId: v.schemeId ?? null, registryId: v.registryId ?? null } });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<EnvironmentalProduct>[]>(() => [
    { field: 'productCode', headerName: 'Code', width: 100, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'productName', headerName: 'Product Name', flex: 1, minWidth: 200 },
    { field: 'productType', headerName: 'Type', width: 120,
      cellRenderer: (p: { value: string }) => <Tag color={PRODUCT_TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    { field: 'schemeName',   headerName: 'Scheme',   flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'registryName', headerName: 'Registry', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'unitOfMeasure', headerName: 'Unit', width: 90, cellClass: 'cell-mono' },
    { field: 'isActive', headerName: 'Active', width: 80, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    { headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: EnvironmentalProduct }) => (
        <Space size={4}>
          <Tooltip title="Edit"><Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} /></Tooltip>
          {p.data.isActive && (
            <Popconfirm title="Deactivate this product?" onConfirm={() => deactivate.mutate(p.data.productId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Tooltip title="Deactivate"><Button type="text" size="small" danger icon={<StopOutlined />} /></Tooltip>
            </Popconfirm>
          )}
        </Space>
      ) },
  ], [deactivate]);

  return (
    <>
      <PageHeader title="Environmental Products" description="Tradeable environmental instruments — EUA, EUAA, UKA, CCA (allowances), REC, GO (certificates), VCU, CER (offsets). Each product is linked to its issuing scheme and registry." moduleGroup="environmental" />
      <SmartGrid columnDefs={colDefs} rowData={data} loading={isLoading} onAdd={openNew} addLabel="New Product" onRefresh={() => { void refetch(); }} getRowId={(p) => String(p.data.productId)} />
      <Drawer mask={false} forceRender title={editing ? `Edit — ${editing.productCode}` : 'New Environmental Product'} open={open} onClose={() => setOpen(false)} width={540}
        footer={<Space style={{ justifyContent: 'flex-end', display: 'flex' }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button><Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button></Space>}>
        <Form form={form} layout="vertical" size="small">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="productCode" label={hint('Product Code', 'Short code used in trade capture — EUA, EUAA, UKA, CCA, REC, GO, VCU, CER.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="EUA" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="productType" label={hint('Type', 'ALLOWANCE = compliance right to emit (e.g. EUA). OFFSET = credit from an emission-reduction project. REC/GO = renewable energy attribute certificate.')} rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={productTypeOpts} />
            </Form.Item>
          </Space>
          <Form.Item name="productName" label="Product Name" rules={[{ required: true }]}>
            <Input placeholder="EU Emission Allowance" />
          </Form.Item>
          <Form.Item name="schemeId" label={hint('Scheme', 'Cap-and-trade or voluntary carbon scheme this product belongs to. Leave blank for products spanning multiple schemes.')}>
            <Select options={schemeOpts} allowClear showSearch optionFilterProp="label" placeholder="Select scheme (optional)" />
          </Form.Item>
          <Form.Item name="registryId" label={hint('Registry', 'Registry where this instrument is issued and tracked.')}>
            <Select options={registryOpts} allowClear showSearch optionFilterProp="label" placeholder="Select registry (optional)" />
          </Form.Item>
          <Form.Item name="unitOfMeasure" label={hint('Unit of Measure', 'tCO2e for allowances and offsets. MWh for RECs and Guarantees of Origin.')} rules={[{ required: true }]}>
            <Input placeholder="tCO2e" style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} placeholder="Brief description of the instrument." />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
