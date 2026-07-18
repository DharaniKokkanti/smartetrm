import { useMemo, useState } from 'react';
import { Button, Space, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { AuditInfo } from '@components/smart/AuditInfo';
import dayjs, { type Dayjs } from 'dayjs';
import { useProducts } from '@features/markets/products/hooks';
import { useSpecTemplates, useSaveSpecTemplate } from './hooks';
import { SPEC_TEMPLATE_COMMODITY_TYPES, type ProductSpecTemplate, type ProductSpecTemplateInput } from './types';

export function ProductSpecTemplatesPage() {
  const { data = [], isLoading, refetch } = useSpecTemplates();
  const save = useSaveSpecTemplate();
  const { data: products = [] } = useProducts();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductSpecTemplate | null>(null);
  const [form] = Form.useForm<ProductSpecTemplateInput>();
  useFormDraft('spec-templates', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ commodityType: 'OIL', isDefault: false, isActive: true } as unknown as ProductSpecTemplateInput);
    setOpen(true);
  }

  function openEdit(r: ProductSpecTemplate) {
    setEditing(r);
    form.setFieldsValue({
      ...r,
      effectiveFrom: r.effectiveFrom ? dayjs(r.effectiveFrom) : undefined,
      effectiveTo: r.effectiveTo ? dayjs(r.effectiveTo) : undefined,
    } as unknown as ProductSpecTemplateInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const v = values as unknown as Record<string, Dayjs | undefined>;
    const input: ProductSpecTemplateInput = {
      ...values,
      effectiveFrom: v.effectiveFrom ? v.effectiveFrom.format('YYYY-MM-DD') : null,
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
    };
    const saved = await save.mutateAsync({ id: editing?.templateId ?? null, input });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const productOpts = useMemo(
    () => (products as { productId: number; productCode: string; productName: string }[]).map((p) => ({ value: p.productId, label: `${p.productCode} — ${p.productName}` })),
    [products],
  );

  const colDefs = useMemo<ColDef<ProductSpecTemplate>[]>(() => [
    { field: 'templateCode', headerName: 'Template Code', width: 170, cellClass: 'cell-mono', pinned: 'left' },
    { field: 'templateName', headerName: 'Template Name', flex: 1, minWidth: 220 },
    { field: 'productCode', headerName: 'Product', width: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'commodityType', headerName: 'Commodity', width: 120, cellRenderer: (p: { value: string }) => <Tag>{p.value}</Tag> },
    { field: 'issuingBody', headerName: 'Issuing Body', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'standardRef', headerName: 'Standard Ref', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    { field: 'version', headerName: 'Version', width: 90, valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveFrom', headerName: 'Eff. From', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'effectiveTo', headerName: 'Eff. To', width: 105, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isDefault', headerName: 'Default', width: 90,
      cellRenderer: (p: { value: boolean }) => <Tag color={p.value ? 'processing' : 'default'}>{p.value ? 'Yes' : 'No'}</Tag>,
    },
    {
      field: 'isActive', headerName: 'Active', width: 90,
      cellRenderer: (p: { value: boolean }) => <Tag color={p.value ? 'success' : 'default'}>{p.value ? 'Yes' : 'No'}</Tag>,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: ProductSpecTemplate }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="Product Spec Templates"
        description="Quality and grade specification parameters per product — API gravity, sulphur %, gas calorific value, metal purity, grain moisture — used to validate cargo assay results and drive quality-adjustment pricing."
        moduleGroup="markets"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Spec Template"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.templateId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? 'Edit Spec Template' : 'New Spec Template'}
        open={open}
        onClose={() => setOpen(false)}
        width={440}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="productId" label="Product" rules={[{ required: true }]}>
            <Select options={productOpts} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="templateCode" label="Template Code" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} placeholder="e.g. DTBRT_BFOE_STD" />
          </Form.Item>
          <Form.Item name="templateName" label="Template Name" rules={[{ required: true }]}>
            <Input placeholder="e.g. Dated Brent / BFOE Standard Loadable Quality" />
          </Form.Item>
          <Form.Item name="commodityType" label="Commodity Type" rules={[{ required: true }]}>
            <Select options={SPEC_TEMPLATE_COMMODITY_TYPES.map((t) => ({ value: t, label: t }))} />
          </Form.Item>
          <Form.Item
            name="issuingBody"
            label={hint('Issuing Body', 'The standards body, exchange, or industry group that defines this specification — e.g. ASTM, ISO, EFET, ICE, or the LME for metals contract specs.')}
          >
            <Input placeholder="e.g. ASTM, ISO, EFET, ICE" />
          </Form.Item>
          <Form.Item
            name="standardRef"
            label={hint('Standard Reference', 'The specific published standard or clause this template implements, e.g. ASTM D86 for distillation, or EN 590 for road diesel.')}
          >
            <Input placeholder="e.g. ASTM D86" />
          </Form.Item>
          <Form.Item name="version" label="Version">
            <Input placeholder="e.g. 2023" />
          </Form.Item>
          <Form.Item name="effectiveFrom" label="Effective From">
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
          <Form.Item name="isDefault" label={hint('Default Template', 'When true, this is the template auto-applied for the product\'s quality checks if no other template is explicitly selected on the trade.')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
        <AuditInfo createdAt={editing?.createdAt} />
      </Drawer>
    </>
  );
}
