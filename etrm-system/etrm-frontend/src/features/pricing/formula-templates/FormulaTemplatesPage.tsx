import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select, Switch } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import { useFormDraft } from '@components/smart/formDraft';
import { COMMODITY_TYPES_TRADE } from '@features/trade/types';
import { useFormulaTemplates, useSaveFormulaTemplate, useDeactivateFormulaTemplate } from './hooks';
import {
  FORMULA_TYPES, AVERAGING_TYPES, AVERAGING_PERIOD_TYPES, FX_FIXING_TYPES,
  type FormulaTemplate, type FormulaTemplateInput,
} from './types';

const TYPE_COLOR: Record<string, string> = {
  INDEX: 'blue', DIFFERENTIAL: 'geekblue', AVERAGE: 'green', WEIGHTED_AVERAGE: 'green',
  BLEND: 'purple', SPREAD: 'orange', FORMULA: 'volcano',
};

export function FormulaTemplatesPage() {
  const { data = [], isLoading, refetch } = useFormulaTemplates();
  const save = useSaveFormulaTemplate();
  const deactivate = useDeactivateFormulaTemplate();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FormulaTemplate | null>(null);
  const [form] = Form.useForm<FormulaTemplateInput>();
  useFormDraft('formula-templates', { form, open, setOpen, editing, setEditing });

  function openNew() {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ formulaType: 'INDEX', fxConversionRequired: false, isActive: true } as unknown as FormulaTemplateInput);
    setOpen(true);
  }

  function openEdit(r: FormulaTemplate) {
    setEditing(r);
    form.setFieldsValue(r as unknown as FormulaTemplateInput);
    setOpen(true);
  }

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.templateId ?? null, input: values });
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<FormulaTemplate>[]>(() => [
    { field: 'templateCode', headerName: 'Code', width: 150, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'templateName', headerName: 'Name', flex: 1, minWidth: 200 },
    { field: 'formulaType', headerName: 'Formula Type', width: 150, cellRenderer: (p: { value: string }) => <Tag color={TYPE_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value.replace(/_/g, ' ')}</Tag> },
    { field: 'commodityType', headerName: 'Commodity', width: 110, valueFormatter: (p) => p.value ?? 'All' },
    { field: 'formulaExpression', headerName: 'Expression', flex: 1, minWidth: 200, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: FormulaTemplate }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this formula template?" onConfirm={() => deactivate.mutate(p.data.templateId)} okText="Deactivate" okButtonProps={{ danger: true }}>
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
        title="Formula Templates"
        description="Reusable price formula templates — Dated Brent ± differential, JCC ×0.1485, average of front-month TTF. Reduces repeated manual formula entry on pricing rules for common structures."
        moduleGroup="pricing"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Formula Template"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.templateId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit Formula — ${editing.templateCode}` : 'New Formula Template'}
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
          <Form.Item name="templateCode" label="Template Code" rules={[{ required: true }]}>
            <Input style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="templateName" label="Template Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="commodityType" label={hint('Commodity Type', 'Leave blank if this template applies across commodities.')}>
            <Select options={COMMODITY_TYPES_TRADE.map((c) => ({ value: c, label: c }))} allowClear />
          </Form.Item>
          <Form.Item name="formulaType" label={hint('Formula Type', 'INDEX = single index price. DIFFERENTIAL = index + fixed adjustment. AVERAGE/WEIGHTED_AVERAGE = averaged over a period. BLEND = weighted blend of multiple indices. SPREAD = difference between two indices. FORMULA = complex multi-component expression.')} rules={[{ required: true }]}>
            <Select options={FORMULA_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} />
          </Form.Item>
          <Form.Item name="formulaExpression" label={hint('Formula Expression', 'Human-readable expression — not executed by the system, for documentation/reference.', '(INDEX_A * WEIGHT_A) + (INDEX_B * WEIGHT_B) + DIFFERENTIAL')}>
            <Input.TextArea rows={2} style={{ fontFamily: 'monospace' }} />
          </Form.Item>
          <Form.Item name="averagingType" label="Averaging Type">
            <Select options={AVERAGING_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} allowClear />
          </Form.Item>
          <Form.Item name="averagingPeriodType" label="Averaging Period">
            <Select options={AVERAGING_PERIOD_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))} allowClear />
          </Form.Item>
          <Form.Item name="fxConversionRequired" label="FX Conversion Required" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item noStyle shouldUpdate={(p, c) => p.fxConversionRequired !== c.fxConversionRequired}>
            {({ getFieldValue }) => getFieldValue('fxConversionRequired') && (
              <Form.Item name="fxFixingType" label={hint('FX Fixing Type', 'SPOT = spot rate on pricing date. AVERAGE = averaged over the pricing period. FIXED = agreed at trade date.')}>
                <Select options={FX_FIXING_TYPES.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
            )}
          </Form.Item>
          <Form.Item name="description" label="Description">
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
