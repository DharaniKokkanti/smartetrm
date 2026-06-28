import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber, Select } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useUomConversions, useSaveUomConversion, useDeleteUomConversion } from '@features/markets/products/hooks';
import { COMMODITY_TYPES, type CommodityType } from '@features/organization/desks/types';
import type { UomConversion, UomConversionInput } from '@features/markets/products/types';

const COMMODITY_COLOR: Record<CommodityType, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
};

export function UomConversionPage() {
  const { data, isLoading, refetch } = useUomConversions();
  const save   = useSaveUomConversion();
  const remove = useDeleteUomConversion();

  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState<UomConversion | null>(null);
  const [filterCommodity, setFilterCommodity] = useState<CommodityType | 'ALL'>('ALL');
  const [form] = Form.useForm<UomConversionInput>();

  const filtered = useMemo(() => {
    const rows = data ?? [];
    if (filterCommodity === 'ALL') return rows;
    return rows.filter((r) => r.commodityType === filterCommodity || r.commodityType === null);
  }, [data, filterCommodity]);

  function openNew() {
    setEditing(null);
    form.resetFields();
    setOpen(true);
  }

  function openEdit(r: UomConversion) {
    setEditing(r);
    form.setFieldsValue({
      fromUomCode:   r.fromUomCode,
      toUomCode:     r.toUomCode,
      factor:        r.factor,
      commodityType: r.commodityType ?? undefined,
      notes:         r.notes ?? undefined,
    } as UomConversionInput);
    setOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    await save.mutateAsync({ id: editing?.conversionId ?? null, input: { ...v, commodityType: v.commodityType ?? null, notes: v.notes ?? null } });
    setOpen(false);
  }

  const colDefs = useMemo<ColDef<UomConversion>[]>(() => [
    {
      headerName: 'From → To', width: 180, pinned: 'left',
      cellRenderer: (p: { data: UomConversion }) => (
        <Space size={4}>
          <code style={{ background: '#f3f4f6', padding: '0 4px', borderRadius: 3 }}>{p.data.fromUomCode}</code>
          <span style={{ color: '#9ca3af' }}>→</span>
          <code style={{ background: '#f3f4f6', padding: '0 4px', borderRadius: 3 }}>{p.data.toUomCode}</code>
        </Space>
      ),
    },
    {
      field: 'factor', headerName: 'Factor', width: 160, type: 'numericColumn',
      valueFormatter: (p) => {
        const n = Number(p.value);
        return n >= 1000 ? n.toLocaleString(undefined, { maximumFractionDigits: 4 }) : n.toPrecision(8).replace(/\.?0+$/, '');
      },
    },
    {
      field: 'commodityType', headerName: 'Commodity', width: 130,
      cellRenderer: (p: { value: CommodityType | null }) =>
        p.value
          ? <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag>
          : <Tag color="default">Universal</Tag>,
    },
    {
      field: 'notes', headerName: 'Notes', flex: 1, minWidth: 220,
      cellStyle: { fontSize: 12, color: '#6b7280' },
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: UomConversion }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          <Popconfirm
            title="Delete this conversion rate?"
            description="This will remove it from the system. Existing positions calculated using this rate are unaffected."
            onConfirm={() => remove.mutate(p.data.conversionId)}
            okText="Delete" okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [remove]);

  const commodityFilterBar = (
    <Space size={4}>
      {(['ALL', ...COMMODITY_TYPES] as const).map((c) => (
        <Button
          key={c}
          size="small"
          type={filterCommodity === c ? 'primary' : 'default'}
          onClick={() => setFilterCommodity(c)}
        >
          {c === 'ALL' ? 'All' : c}
        </Button>
      ))}
    </Space>
  );

  return (
    <>
      <PageHeader
        title="UoM Conversions"
        description="Conversion factors between units of measure, scoped per commodity type. Used by position management to convert BBL↔MT, SCM↔MWH, BUSHEL↔MT. Rows with no commodity type are universal (e.g. MT↔KG). Product-level density and GCV fields override these defaults."
        moduleGroup="reference"
      />
      <div style={{ padding: '0 16px 8px' }}>{commodityFilterBar}</div>
      <SmartGrid
        columnDefs={colDefs}
        rowData={filtered}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Conversion"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.conversionId)}
      />

      <Drawer
        title={editing ? `Edit Conversion — ${editing.fromUomCode} → ${editing.toUomCode}` : 'New UoM Conversion'}
        open={open}
        onClose={() => setOpen(false)}
        width={480}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="fromUomCode" label={hint('From UoM', 'Source unit code — must match an existing UoM in the system.', 'BBL')}
              rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="BBL" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
            <Form.Item name="toUomCode" label={hint('To UoM', 'Target unit code.', 'MT')}
              rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="MT" style={{ fontFamily: 'monospace', textTransform: 'uppercase' }} />
            </Form.Item>
          </Space>
          <Form.Item name="factor"
            label={hint('Conversion Factor', '1 [FromUoM] × factor = [ToUoM]. Example: 1 BBL × 0.1364 = MT. Factor must be positive.', '0.136400')}
            rules={[{ required: true }, { type: 'number', min: 0.000000001, message: 'Must be positive.' }]}>
            <InputNumber precision={10} style={{ width: '100%' }} placeholder="0.136400" min={0} />
          </Form.Item>
          <Form.Item name="commodityType"
            label={hint('Commodity Type', 'Leave blank for universal conversions (e.g. MT↔KG) that apply to all commodities. Set to a specific commodity when the conversion is product-class-specific (e.g. BBL↔MT for OIL).', 'OIL')}>
            <Select
              allowClear
              placeholder="Universal (all commodities)"
              options={COMMODITY_TYPES.map((c) => ({ value: c, label: c }))}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea
              rows={3}
              placeholder="Source authority, assumptions (e.g. default density), or relevant standard (e.g. ASTM D4894, API MPMS Chapter 11)"
            />
          </Form.Item>
        </Form>
      </Drawer>
    </>
  );
}
