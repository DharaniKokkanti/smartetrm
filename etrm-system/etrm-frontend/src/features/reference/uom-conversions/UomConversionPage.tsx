import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag, Drawer, Form, Input, InputNumber, Select, Switch, Tooltip, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, SwapOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { hint } from '@components/smart/FieldHint';
import { useUomConversions, useSaveUomConversion, useDeleteUomConversion } from './hooks';
import { useUom } from '@features/reference/uom/hooks';
import { COMMODITY_TYPES, type CommodityType } from '@features/reference/commodity-types/types';
import type { UomConversion, UomConversionInput } from './types';
import { useFormDraft } from '@components/smart/formDraft';

const COMMODITY_COLOR: Record<CommodityType, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
  LNG: 'cyan', FREIGHT: 'orange', RINS: 'lime', ENVIRONMENTAL: 'geekblue', MULTI: 'magenta', OTHER: 'default',
};

const UOM_TYPE_COLOR: Record<string, string> = {
  VOLUME: 'geekblue', WEIGHT: 'orange', ENERGY: 'gold', POWER: 'purple', TEMPERATURE: 'red', COUNT: 'cyan', OTHER: 'default',
};

function UomTag({ code, typeMap }: { code: string; typeMap: Map<string, string> }) {
  const type = typeMap.get(code);
  return (
    <Space size={3}>
      {type && <Tag color={UOM_TYPE_COLOR[type]} style={{ fontSize: 10, margin: 0, padding: '0 4px' }}>{type}</Tag>}
      <code style={{ background: '#f3f4f6', padding: '0 5px', borderRadius: 3, fontSize: 12 }}>{code}</code>
    </Space>
  );
}

function ConversionTypeTag({ fromType, toType }: { fromType?: string; toType?: string }) {
  if (!fromType || !toType) return null;
  if (fromType === toType) {
    return <Tag color="default" style={{ fontSize: 10 }}>Same type — fixed ratio</Tag>;
  }
  return (
    <Tooltip title={`Cross-type: ${fromType} → ${toType}. This conversion requires a per-product physical property (density for Volume↔Weight, calorific value for Volume↔Energy). Every product has a different value — no commodity-level default applies. Set the property on the product's Pricing Basis tab.`}>
      <Tag color="error" style={{ fontSize: 10, cursor: 'help' }}>
        <SwapOutlined /> Product-specific only <InfoCircleOutlined />
      </Tag>
    </Tooltip>
  );
}

export function UomConversionPage() {
  const { data, isLoading, refetch } = useUomConversions();
  const { data: uoms = [] }          = useUom();
  const save   = useSaveUomConversion();
  const remove = useDeleteUomConversion();

  const [open, setOpen]           = useState(false);
  const [editing, setEditing]     = useState<UomConversion | null>(null);
  const [addReverse, setAddReverse] = useState(false);
  const [filterCommodity, setFilterCommodity] = useState<CommodityType | 'ALL'>('ALL');
  const [form] = Form.useForm<UomConversionInput>();
  useFormDraft('ref-uom-conversions', { form, open, setOpen, editing, setEditing });

  // Dynamic labels in the drawer — update as user picks units
  const fromWatch    = Form.useWatch('fromUomCode', form) as string | undefined;
  const toWatch      = Form.useWatch('toUomCode',   form) as string | undefined;
  const factorWatch  = Form.useWatch('factor',      form) as number | undefined;
  const fromLabel    = fromWatch ?? 'Source';
  const toLabel      = toWatch   ?? 'Destination';

  // code → uomType lookup built from live UoM list
  const uomTypeMap = useMemo(() => {
    const m = new Map<string, string>();
    uoms.forEach((u) => m.set(u.uomCode, u.uomTypeCode));
    return m;
  }, [uoms]);

  // Sorted UoM options for the dropdown selectors in the drawer
  const uomOptions = useMemo(
    () => uoms
      .filter((u) => u.isActive)
      .sort((a, b) => a.uomCode.localeCompare(b.uomCode))
      .map((u) => ({
        value: u.uomCode,
        label: `${u.uomCode} — ${u.uomName}`,
        title: u.uomTypeCode,
      })),
    [uoms],
  );

  const filtered = useMemo(() => {
    const rows = data ?? [];
    if (filterCommodity === 'ALL') return rows;
    return rows.filter((r) => r.commodityType === filterCommodity || r.commodityType === null);
  }, [data, filterCommodity]);

  function openNew() {
    setEditing(null);
    setAddReverse(false);
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

  async function submit(closeAfter = true) {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.conversionId ?? null, input: { ...v, commodityType: v.commodityType ?? null, notes: v.notes ?? null, rowVersion: editing?.rowVersion ?? 0 } });
    if (!editing && addReverse && v.factor && v.factor > 0) {
      const reverseNote = v.notes
        ? `Auto-generated reverse of: ${v.notes}`
        : `Auto-generated reverse of 1 ${v.fromUomCode} = ${v.factor} ${v.toUomCode}`;
      await save.mutateAsync({
        id: null,
        input: {
          fromUomCode:   v.toUomCode,
          toUomCode:     v.fromUomCode,
          factor:        1 / v.factor,
          commodityType: v.commodityType ?? null,
          notes:         reverseNote,
          rowVersion:    0,
        },
      });
    }
    setAddReverse(false);
    if (closeAfter) setOpen(false); else setEditing(saved);
  }

  const colDefs = useMemo<ColDef<UomConversion>[]>(() => [
    {
      headerName: 'From', width: 160,
      cellRenderer: (p: { data: UomConversion }) => (
        <UomTag code={p.data.fromUomCode} typeMap={uomTypeMap} />
      ),
    },
    {
      headerName: 'To', width: 160,
      cellRenderer: (p: { data: UomConversion }) => (
        <UomTag code={p.data.toUomCode} typeMap={uomTypeMap} />
      ),
    },
    {
      headerName: 'Conversion Type', width: 180, sortable: false, filter: false,
      cellRenderer: (p: { data: UomConversion }) => (
        <ConversionTypeTag
          fromType={uomTypeMap.get(p.data.fromUomCode)}
          toType={uomTypeMap.get(p.data.toUomCode)}
        />
      ),
    },
    {
      field: 'factor', headerName: 'Conversion Formula', width: 240, type: 'numericColumn',
      cellRenderer: (p: { data: UomConversion }) => {
        const n = Number(p.data.factor);
        const display = n >= 1000
          ? n.toLocaleString(undefined, { maximumFractionDigits: 4 })
          : n.toPrecision(8).replace(/\.?0+$/, '');
        const fromType = uomTypeMap.get(p.data.fromUomCode);
        const toType   = uomTypeMap.get(p.data.toUomCode);
        const isCross  = fromType && toType && fromType !== toType;
        return (
          <Space size={4}>
            <code style={{ color: '#6b7280', fontSize: 11 }}>1 {p.data.fromUomCode} =</code>
            <code style={{ color: isCross ? '#d97706' : '#111827' }}>{display}</code>
            <code style={{ color: '#6b7280', fontSize: 11 }}>{p.data.toUomCode}</code>
          </Space>
        );
      },
    },
    {
      field: 'commodityType', headerName: 'Scope', width: 150,
      cellRenderer: (p: { value: CommodityType | null }) =>
        p.value
          ? <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag>
          : <Tag color="default">Universal</Tag>,
    },
    {
      field: 'notes', headerName: 'Notes / Authority', flex: 1, minWidth: 220,
      cellStyle: { fontSize: 11, color: '#6b7280' },
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: UomConversion }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          <Popconfirm
            title="Delete this conversion rate?"
            description="Existing positions calculated using this rate are unaffected."
            onConfirm={() => remove.mutate(p.data.conversionId)}
            okText="Delete" okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [remove, uomTypeMap]);

  const commodityFilterBar = (
    <Space size={4} wrap>
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
        description="Fixed conversion factors between units of the SAME type (Volume↔Volume, Energy↔Energy, Weight↔Weight). These are exact physical constants and apply universally or per commodity class. Cross-type conversions (Volume↔Weight, Volume↔Energy) are NOT stored here — they require a product-specific density or GCV which varies per product. Set those on each product's Pricing Basis section."
        moduleGroup="reference"
      />

      <div style={{ padding: '0 16px 4px' }}>
        <Space size={0} direction="vertical" style={{ width: '100%' }}>
          <div style={{ padding: '6px 0 8px', display: 'flex', alignItems: 'center', gap: 12 }}>
            {commodityFilterBar}
          </div>
          <Space size={16} style={{ fontSize: 12, color: '#6b7280', paddingBottom: 4 }}>
            <Space size={4}>
              <Tag color="default" style={{ fontSize: 10 }}>Same type — fixed ratio</Tag>
              <span>Volume↔Volume, Energy↔Energy, Weight↔Weight — stored here</span>
            </Space>
            <Space size={4}>
              <Tag color="error" style={{ fontSize: 10 }}><SwapOutlined /> Product-specific only</Tag>
              <span>Volume↔Weight (needs density) or Volume↔Energy (needs GCV) — set on each product</span>
            </Space>
          </Space>
        </Space>
      </div>

      <SmartGrid
        columnDefs={colDefs}
        rowData={filtered}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Conversion"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.conversionId)}
      />

      <Drawer mask={false} forceRender
        title={editing ? `Edit — ${editing.fromUomCode} → ${editing.toUomCode}` : 'New UoM Conversion'}
        open={open}
        onClose={() => setOpen(false)}
        width={500}
        footer={
          <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
            <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="fromUomCode" label="Source UoM" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                showSearch
                placeholder="Select source unit"
                options={uomOptions}
                optionFilterProp="label"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
            <Form.Item name="toUomCode" label="Destination UoM" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select
                showSearch
                placeholder="Select destination unit"
                options={uomOptions}
                optionFilterProp="label"
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="factor"
            label={hint(
              `1 ${fromLabel} = ? ${toLabel}`,
              `How many ${toLabel} is one ${fromLabel}? Only enter same-type conversions (Volume→Volume, Energy→Energy, Weight→Weight). Cross-type conversions (Volume↔Weight, Volume↔Energy) require a product-specific physical property — do NOT enter them here.`,
              fromWatch && toWatch ? `e.g. 1 ${fromWatch} = X ${toWatch}` : '0.000000',
            )}
            rules={[{ required: true }, { type: 'number', min: 0.000000001, message: 'Must be positive.' }]}
          >
            <InputNumber precision={10} style={{ width: '100%' }} placeholder="Enter factor" min={0} />
          </Form.Item>

          {!editing && fromWatch && toWatch && factorWatch && factorWatch > 0 && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 6, padding: '8px 12px', marginBottom: 16 }}>
              <Space align="center">
                <Switch size="small" checked={addReverse} onChange={setAddReverse} />
                <Typography.Text style={{ fontSize: 12 }}>
                  Also add reverse rate:{' '}
                  <code>1 {toWatch} = {(1 / factorWatch).toPrecision(8).replace(/\.?0+$/, '')} {fromWatch}</code>
                </Typography.Text>
              </Space>
              <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                Creates both directions in one step so users don't need to enter the inverse manually.
              </Typography.Text>
            </div>
          )}

          <Form.Item
            name="commodityType"
            label={hint(
              'Scope',
              `Leave blank if this conversion applies universally to all commodities (e.g. weight units). Choose a specific commodity class if this conversion only makes sense for that type (e.g. ${fromLabel} ↔ ${toLabel} may be OIL-specific).`,
              'OIL',
            )}
          >
            <Select
              allowClear
              placeholder="Universal (all commodities)"
              options={COMMODITY_TYPES.map((c) => ({ value: c, label: c }))}
            />
          </Form.Item>

          <Form.Item name="notes" label="Notes / Authority">
            <Input.TextArea
              rows={3}
              placeholder="Source standard or authority for this conversion factor (e.g. API standard, NIST, ISO, exchange rule)"
            />
          </Form.Item>

          <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', padding: '8px 0' }}>
            <strong>Cross-type conversions (Volume↔Weight, Volume↔Energy) do not belong here.</strong>{' '}
            Each product has a unique density and calorific value — a single commodity-level factor would be wrong for most products. Set density and GCV on each product under Pricing Basis instead.
          </Typography.Text>
        </Form>
      </Drawer>
    </>
  );
}
