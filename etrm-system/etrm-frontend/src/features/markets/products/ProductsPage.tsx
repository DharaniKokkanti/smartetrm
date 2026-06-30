import { useMemo, useState } from 'react';
import {
  Button, Space, Popconfirm, Tag, Drawer, Form, Input, Select,
  InputNumber, Switch, Divider, Typography, Tabs, Table, Badge,
  Tooltip, Collapse, Alert, Empty, Spin, Modal,
} from 'antd';
import {
  EditOutlined, StopOutlined, LinkOutlined, DeleteOutlined,
  BarChartOutlined, GlobalOutlined, ExperimentOutlined, ApartmentOutlined,
  PlusOutlined, SaveOutlined,
} from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import type { ColumnsType } from 'antd/es/table';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { hint } from '@components/smart/FieldHint';
import {
  useProducts, useSaveProduct, useDeactivateProduct,
  useProductPriceIndices, useLinkPriceIndex, useUnlinkPriceIndex,
  useProductMarkets, useProductSpecTemplates, useAddSpecTemplate, useSpecValues,
  useProductBlendComponents, useAddBlendComponent, useRemoveBlendComponent,
  useSpecParameters, useAddSpecValue, useUpdateSpecValue, useDeleteSpecValue,
  useUomConversions,
} from './hooks';
import { usePriceIndices } from '@features/markets/price-indices/hooks';
import {
  SETTLEMENT_TYPES, PRODUCT_FAMILIES,
  type Product, type ProductInput, type SettlementType,
  type ProductPriceIndex, type ProductMarketLink, type IndexRole,
  type ProductSpecTemplate, type ProductSpecValue, type BlendComponent,
  type BoundDirection, type ParameterCategory, type SpecParameter,
} from './types';
import { COMMODITY_TYPES, type CommodityType } from '@features/organization/desks/types';

// ── Static maps ───────────────────────────────────────────────────────────────

const SETTLE_COLOR: Record<SettlementType, string> = {
  PHYSICAL: 'blue', FINANCIAL: 'purple', OPTIONS: 'orange', SWAP: 'cyan',
};
const COMMODITY_COLOR: Record<CommodityType, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
};
const ROLE_COLOR: Record<IndexRole, string> = {
  PRIMARY_MTM: 'green', SETTLEMENT: 'blue', BACKUP: 'orange', REFERENCE: 'default',
};

const UOM_OPTIONS = ['BBL', 'MT', 'KBD', 'MWH', 'GWH', 'MW', 'MMBTU', 'MCM', 'THERM', 'BUSHEL', 'KG', 'TROY_OZ'];
const PRICING_TYPE_OPTIONS = ['FLAT', 'INDEX', 'DIFFERENTIAL', 'FORMULA', 'FLOATING', 'TBN'];

// ── Price Index Link tab ──────────────────────────────────────────────────────

function PriceIndicesTab({ productId }: { productId: number }) {
  const { data = [], isLoading } = useProductPriceIndices(productId);
  const { data: allIndices = [], isLoading: indicesLoading } = usePriceIndices();
  const link   = useLinkPriceIndex(productId);
  const unlink = useUnlinkPriceIndex(productId);
  const [linkForm] = Form.useForm<{ priceIndexId: number; role: IndexRole; isPrimary: boolean }>();
  const [showLink, setShowLink] = useState(false);

  const indexOptions = useMemo(
    () => allIndices
      .filter((i) => i.isActive)
      .sort((a, b) => a.indexCode.localeCompare(b.indexCode))
      .map((i) => ({
        value: i.priceIndexId,
        label: `${i.indexCode} — ${i.indexName} (${i.publicationSource})`,
      })),
    [allIndices],
  );

  async function submitLink() {
    const v = await linkForm.validateFields();
    await link.mutateAsync(v);
    linkForm.resetFields();
    setShowLink(false);
  }

  const cols: ColumnsType<ProductPriceIndex> = [
    { title: 'Index Code', dataIndex: 'indexCode', width: 140, render: (v: string) => <code>{v}</code> },
    { title: 'Index Name', dataIndex: 'indexName', ellipsis: true },
    { title: 'Source', dataIndex: 'publicationSource', width: 100,
      render: (v: string) => <Tag>{v}</Tag> },
    { title: 'CCY', dataIndex: 'currencyCode', width: 70, render: (v: string) => <code>{v}</code> },
    { title: 'UoM', dataIndex: 'uomCode', width: 80, render: (v: string) => <code>{v}</code> },
    {
      title: 'Role', dataIndex: 'role', width: 130,
      render: (v: IndexRole) => <Tag color={ROLE_COLOR[v]}>{v.replace('_', ' ')}</Tag>,
    },
    {
      title: '', width: 60, align: 'center' as const,
      render: (_: unknown, r: ProductPriceIndex) => (
        <Popconfirm title="Unlink this price index?" onConfirm={() => unlink.mutate(r.productIndexId)}
          okText="Unlink" okButtonProps={{ danger: true }}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Price indices used for mark-to-market, settlement, and reference pricing.
        </Typography.Text>
        <Button size="small" icon={<LinkOutlined />} onClick={() => setShowLink(!showLink)}>
          Link Index
        </Button>
      </div>

      {showLink && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <Form form={linkForm} layout="inline" size="small">
            <Form.Item name="priceIndexId" label="Price Index" rules={[{ required: true }]}>
              <Select
                showSearch
                placeholder="Search by code or name…"
                options={indexOptions}
                optionFilterProp="label"
                loading={indicesLoading}
                style={{ width: 300 }}
              />
            </Form.Item>
            <Form.Item name="role" label="Role" rules={[{ required: true }]}
              initialValue="PRIMARY_MTM">
              <Select style={{ width: 140 }} options={[
                { value: 'PRIMARY_MTM',  label: 'Primary MTM' },
                { value: 'SETTLEMENT',   label: 'Settlement' },
                { value: 'BACKUP',       label: 'Backup' },
                { value: 'REFERENCE',    label: 'Reference' },
              ]} />
            </Form.Item>
            <Form.Item name="isPrimary" label="Primary" valuePropName="checked" initialValue={false}>
              <Switch size="small" />
            </Form.Item>
            <Button type="primary" size="small" onClick={submitLink} loading={link.isPending}>Add</Button>
            <Button size="small" onClick={() => setShowLink(false)} style={{ marginLeft: 4 }}>Cancel</Button>
          </Form>
        </div>
      )}

      <Table
        size="small"
        columns={cols}
        dataSource={data}
        loading={isLoading}
        rowKey="productIndexId"
        pagination={false}
        locale={{ emptyText: 'No price indices linked yet.' }}
      />
    </div>
  );
}

// ── Market Links tab ──────────────────────────────────────────────────────────

function MarketsTab({ productId }: { productId: number }) {
  const { data = [], isLoading } = useProductMarkets(productId);

  const cols: ColumnsType<ProductMarketLink> = [
    { title: 'Market Code', dataIndex: 'marketCode', width: 160, render: (v: string) => <code>{v}</code> },
    { title: 'Market Name', dataIndex: 'marketName', ellipsis: true },
    { title: 'Ticker', dataIndex: 'ticker', width: 100,
      render: (v: string | null) => v ? <code>{v}</code> : <span style={{ color: '#9ca3af' }}>—</span> },
    { title: 'CCY', dataIndex: 'currencyCode', width: 70,
      render: (v: string | null) => v ? <code>{v}</code> : '—' },
    { title: 'UoM', dataIndex: 'uomCode', width: 80,
      render: (v: string | null) => v ? <code>{v}</code> : '—' },
    { title: 'Lot Size', dataIndex: 'lotSize', width: 90, align: 'right' as const,
      render: (v: number | null) => v != null ? v.toLocaleString() : '—' },
    {
      title: 'LTD Offset', dataIndex: 'lastTradingDayOffset', width: 100, align: 'center' as const,
      render: (v: number | null) => v != null ? `${v}D` : '—',
    },
    {
      title: 'Status', dataIndex: 'isActive', width: 80,
      render: (v: boolean) => <ActiveTag active={v} />,
    },
  ];

  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
        Markets and exchanges where this product is listed or traded. Market-specific attributes
        (ticker, lot size) override product defaults. Manage from Markets → Market Products.
      </Typography.Text>
      <Table
        size="small"
        columns={cols}
        dataSource={data}
        loading={isLoading}
        rowKey="marketProductId"
        pagination={false}
        locale={{ emptyText: 'Not listed on any market.' }}
      />
    </div>
  );
}

// ── Quality Specs Tab ─────────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<ParameterCategory, string> = {
  PHYSICAL: 'blue', CHEMICAL: 'green', ENERGY: 'gold',
  QUALITY: 'cyan', SAFETY: 'red', REGULATORY: 'purple', OTHER: 'default',
};

function formatBound(v: ProductSpecValue): string {
  const fmt = (n: number | null) => (n != null ? String(n) : '?');
  switch (v.boundDirection as BoundDirection) {
    case 'RANGE':       return `${fmt(v.valueMin)} – ${fmt(v.valueMax)}`;
    case 'MIN_ONLY':    return `≥ ${fmt(v.valueMin)}`;
    case 'MAX_ONLY':    return `≤ ${fmt(v.valueMax)}`;
    case 'EXACT':       return `= ${v.valueExact ?? v.valueText ?? '?'}`;
    case 'REPORT_ONLY': return 'Report only';
    case 'NOT_EXCEED':  return `≤ ${fmt(v.valueMax)} (NE)`;
    default:            return '—';
  }
}

const BOUND_OPTIONS: { value: BoundDirection; label: string }[] = [
  { value: 'RANGE',       label: 'Range (min–max)' },
  { value: 'MIN_ONLY',    label: '≥ Min only' },
  { value: 'MAX_ONLY',    label: '≤ Max only' },
  { value: 'EXACT',       label: '= Exact' },
  { value: 'REPORT_ONLY', label: 'Report only' },
  { value: 'NOT_EXCEED',  label: '≤ Not exceed' },
];

type SpecValueFormValues = {
  parameterId: number;
  uomCode: string | null;
  boundDirection: BoundDirection;
  valueMin: number | null;
  valueMax: number | null;
  valueTypical: number | null;
  valueExact: number | null;
  valueText: string | null;
  isMandatory: boolean;
  testMethod: string | null;
  notes: string | null;
};

function SpecTemplateValues({ templateId, commodityType }: { templateId: number; commodityType: CommodityType }) {
  const { data = [], isLoading } = useSpecValues(templateId);
  const { data: params = [] }   = useSpecParameters(commodityType);
  const addVal    = useAddSpecValue(templateId);
  const updateVal = useUpdateSpecValue(templateId);
  const deleteVal = useDeleteSpecValue(templateId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<ProductSpecValue | null>(null);
  const [valForm] = Form.useForm<SpecValueFormValues>();
  const boundWatch = (Form.useWatch('boundDirection', valForm) ?? 'MAX_ONLY') as BoundDirection;

  const paramMap = useMemo(() => {
    const m = new Map<number, SpecParameter>();
    params.forEach((p) => m.set(p.parameterId, p));
    return m;
  }, [params]);

  function openAddModal() {
    setEditingValue(null);
    valForm.resetFields();
    valForm.setFieldsValue({ isMandatory: true, boundDirection: 'MAX_ONLY' });
    setModalOpen(true);
  }

  function openEditModal(sv: ProductSpecValue) {
    setEditingValue(sv);
    valForm.setFieldsValue({
      parameterId:   sv.parameterId,
      uomCode:       sv.uomCode ?? undefined,
      boundDirection:sv.boundDirection,
      valueMin:      sv.valueMin ?? undefined,
      valueMax:      sv.valueMax ?? undefined,
      valueTypical:  sv.valueTypical ?? undefined,
      valueExact:    sv.valueExact ?? undefined,
      valueText:     sv.valueText ?? undefined,
      isMandatory:   sv.isMandatory,
      testMethod:    sv.testMethod ?? undefined,
      notes:         sv.notes ?? undefined,
    } as SpecValueFormValues);
    setModalOpen(true);
  }

  async function saveModal() {
    const v = await valForm.validateFields();
    const param = paramMap.get(v.parameterId);
    const payload = {
      templateId,
      parameterId:      v.parameterId,
      parameterCode:    param?.parameterCode ?? '',
      parameterName:    param?.parameterName ?? '',
      parameterCategory: param?.parameterCategory ?? 'OTHER',
      uomCode:          v.uomCode ?? null,
      boundDirection:   v.boundDirection,
      valueMin:         v.valueMin ?? null,
      valueMax:         v.valueMax ?? null,
      valueTypical:     v.valueTypical ?? null,
      valueExact:       v.valueExact ?? null,
      valueText:        v.valueText ?? null,
      isMandatory:      v.isMandatory,
      testMethod:       v.testMethod ?? null,
      notes:            v.notes ?? null,
    };
    if (editingValue) {
      await updateVal.mutateAsync({ specValueId: editingValue.specValueId, input: payload });
    } else {
      await addVal.mutateAsync(payload);
    }
    setModalOpen(false);
  }

  const cols: ColumnsType<ProductSpecValue> = [
    {
      title: 'Category', dataIndex: 'parameterCategory', width: 100,
      render: (v: ParameterCategory) => <Tag color={CATEGORY_COLOR[v]} style={{ fontSize: 11 }}>{v}</Tag>,
    },
    { title: 'Parameter', dataIndex: 'parameterName', ellipsis: true },
    { title: 'UoM', dataIndex: 'uomCode', width: 70, render: (v: string | null) => v ? <code>{v}</code> : '—' },
    {
      title: 'Limit / Range', width: 150, align: 'center' as const,
      render: (_: unknown, r: ProductSpecValue) => <code style={{ fontSize: 12 }}>{formatBound(r)}</code>,
    },
    {
      title: 'Typical', dataIndex: 'valueTypical', width: 80, align: 'right' as const,
      render: (v: number | null) => v != null ? <code>{v}</code> : <span style={{ color: '#9ca3af' }}>—</span>,
    },
    {
      title: '', dataIndex: 'isMandatory', width: 40, align: 'center' as const,
      render: (v: boolean) => v
        ? <Tooltip title="Mandatory"><Tag color="red" style={{ margin: 0, fontSize: 10 }}>M</Tag></Tooltip>
        : null,
    },
    {
      title: 'Test Method', dataIndex: 'testMethod', width: 140,
      render: (v: string | null) => v ? <span style={{ fontSize: 11, color: '#6b7280' }}>{v}</span> : '—',
    },
    {
      title: '', width: 70, align: 'center' as const,
      render: (_: unknown, r: ProductSpecValue) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditModal(r)} />
          <Popconfirm title="Remove this spec value?" onConfirm={() => deleteVal.mutate(r.specValueId)}
            okText="Remove" okButtonProps={{ danger: true }}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <Button size="small" icon={<PlusOutlined />} onClick={openAddModal}>Add Spec Value</Button>
      </div>
      {isLoading
        ? <div style={{ padding: 24, textAlign: 'center' }}><Spin size="small" /></div>
        : !data.length
          ? <Empty description="No spec values defined yet." image={Empty.PRESENTED_IMAGE_SIMPLE} />
          : <Table size="small" columns={cols} dataSource={data} rowKey="specValueId" pagination={false} style={{ fontSize: 12 }} />
      }

      <Modal
        title={editingValue ? 'Edit Spec Value' : 'Add Spec Value'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={saveModal}
        okText={<Space><SaveOutlined />{editingValue ? 'Update' : 'Add'}</Space>}
        confirmLoading={addVal.isPending || updateVal.isPending}
        width={560}
      >
        <Form form={valForm} layout="vertical" size="small">
          <Form.Item name="parameterId" label="Parameter" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select spec parameter"
              options={params.map((p) => ({
                value: p.parameterId,
                label: `${p.parameterName}`,
                title: p.parameterCode,
              }))}
              optionFilterProp="label"
            />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="boundDirection" label="Bound Type" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Select options={BOUND_OPTIONS} />
            </Form.Item>
            <Form.Item name="uomCode" label="UoM (override)" style={{ flex: 1 }}>
              <Input placeholder="e.g. cSt, KG/L, µm" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={8}>
            {(boundWatch === 'RANGE' || boundWatch === 'MIN_ONLY') && (
              <Form.Item name="valueMin" label="Min" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            )}
            {(boundWatch === 'RANGE' || boundWatch === 'MAX_ONLY' || boundWatch === 'NOT_EXCEED') && (
              <Form.Item name="valueMax" label="Max" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            )}
            {boundWatch === 'EXACT' && (
              <Form.Item name="valueExact" label="Exact (numeric)" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            )}
            {boundWatch === 'EXACT' && (
              <Form.Item name="valueText" label="Exact (text)" style={{ flex: 1 }}>
                <Input placeholder="TRUE / Grade A / etc." />
              </Form.Item>
            )}
            {boundWatch !== 'EXACT' && boundWatch !== 'REPORT_ONLY' && (
              <Form.Item name="valueTypical" label="Typical" style={{ flex: 1 }}>
                <InputNumber style={{ width: '100%' }} />
              </Form.Item>
            )}
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="testMethod" label="Test Method" style={{ flex: 1 }}>
              <Input placeholder="ASTM D4294 / ISO 6976 / etc." />
            </Form.Item>
            <Form.Item name="isMandatory" label="Mandatory" valuePropName="checked" style={{ flex: 0, minWidth: 90 }}>
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional context, exceptions, or regulatory references" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

function TemplateCollapseHeader({ t }: { t: ProductSpecTemplate }) {
  return (
    <Space>
      <code style={{ fontSize: 12 }}>{t.templateCode}</code>
      <span style={{ color: '#374151' }}>{t.templateName}</span>
      {t.isDefault && <Tag color="green" style={{ fontSize: 10, margin: 0 }}>Default</Tag>}
      {t.standardRef && (
        <span style={{ color: '#9ca3af', fontSize: 11 }}>({t.standardRef})</span>
      )}
    </Space>
  );
}

const BLEND_COMPONENT_COLS = (onRemove: (id: number) => void): ColumnsType<BlendComponent> => [
  { title: '#', dataIndex: 'sequenceNo', width: 40, align: 'center' as const },
  {
    title: 'Component', dataIndex: 'componentCode', width: 180,
    render: (v: string, r: BlendComponent) => (
      <div>
        <code style={{ fontSize: 12 }}>{v}</code>
        <div style={{ fontSize: 11, color: '#6b7280' }}>{r.componentName}</div>
      </div>
    ),
  },
  {
    title: 'Min %vol', dataIndex: 'minPct', width: 80, align: 'right' as const,
    render: (v: number | null) => v != null ? `${v}%` : '—',
  },
  {
    title: 'Target %vol', dataIndex: 'targetPct', width: 90, align: 'right' as const,
    render: (v: number) => <strong>{v}%</strong>,
  },
  {
    title: 'Max %vol', dataIndex: 'maxPct', width: 80, align: 'right' as const,
    render: (v: number | null) => v != null ? `${v}%` : '—',
  },
  {
    title: 'Tolerance', dataIndex: 'tolerancePct', width: 90, align: 'center' as const,
    render: (v: number) => <span style={{ color: '#6b7280' }}>±{v}%</span>,
  },
  {
    title: 'Position Gen', dataIndex: 'needsPositionGen', width: 110, align: 'center' as const,
    render: (v: boolean) => v
      ? <Tag color="green" style={{ fontSize: 10, margin: 0 }}>Yes — generate</Tag>
      : <Tag color="default" style={{ fontSize: 10, margin: 0 }}>No — skip</Tag>,
  },
  {
    title: '', width: 50, align: 'center' as const,
    render: (_: unknown, r: BlendComponent) => (
      <Popconfirm title="Remove blend component?" onConfirm={() => onRemove(r.blendComponentId)}
        okText="Remove" okButtonProps={{ danger: true }}>
        <Button type="text" size="small" danger icon={<DeleteOutlined />} />
      </Popconfirm>
    ),
  },
];

type AddTemplateFormValues = {
  templateCode: string; templateName: string; isDefault: boolean;
  issuingBody: string | null; standardRef: string | null; version: string | null; notes: string | null;
};

function SpecsTab({ product, isBlend }: { product: Product; isBlend: boolean }) {
  const { data: templates = [], isLoading: tplLoading } = useProductSpecTemplates(product.productId);
  const { data: components = [], isLoading: blendLoading } = useProductBlendComponents(
    isBlend ? product.productId : null,
  );
  const { data: allProducts = [] } = useProducts();
  const addComp    = useAddBlendComponent(product.productId);
  const removeComp = useRemoveBlendComponent(product.productId);
  const addTemplate = useAddSpecTemplate(product.productId);
  const [addCompForm] = Form.useForm<{ componentProductId: number; sequenceNo: number; targetPct: number; minPct: number | null; maxPct: number | null; tolerancePct: number; notes: string | null; needsPositionGen: boolean }>();
  const [tplForm] = Form.useForm<AddTemplateFormValues>();
  const [showAddComp, setShowAddComp] = useState(false);
  const [tplModalOpen, setTplModalOpen] = useState(false);

  const componentProductOptions = useMemo(
    () => allProducts
      .filter((p) => p.productId !== product.productId && p.isActive)
      .map((p) => ({
        value: p.productId,
        label: `${p.productCode} — ${p.productName}`,
      })),
    [allProducts, product.productId],
  );

  async function submitAddComp() {
    const v = await addCompForm.validateFields();
    await addComp.mutateAsync({ ...v, minPct: v.minPct ?? null, maxPct: v.maxPct ?? null, notes: v.notes ?? null });
    addCompForm.resetFields();
    setShowAddComp(false);
  }

  async function submitAddTemplate() {
    const v = await tplForm.validateFields();
    await addTemplate.mutateAsync({
      templateCode:  v.templateCode,
      templateName:  v.templateName,
      commodityType: product.commodityType,
      isDefault:     v.isDefault ?? false,
      issuingBody:   v.issuingBody ?? null,
      standardRef:   v.standardRef ?? null,
      version:       v.version ?? null,
      effectiveFrom: null,
      effectiveTo:   null,
      notes:         v.notes ?? null,
      isActive:      true,
    });
    tplForm.resetFields();
    setTplModalOpen(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Blend Recipe ────────────────────────────────────────────────── */}
      {isBlend && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Typography.Text strong><ApartmentOutlined style={{ marginRight: 6 }} />Blend Recipe</Typography.Text>
            <Button size="small" icon={<PlusOutlined />} onClick={() => setShowAddComp(!showAddComp)}>
              Add Component
            </Button>
          </div>
          {(product.blendNotes) && (
            <Alert type="info" showIcon message={product.blendNotes} style={{ marginBottom: 10, fontSize: 12 }} />
          )}
          {showAddComp && (
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <Form form={addCompForm} layout="vertical" size="small">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
                  <Form.Item name="componentProductId" label="Component Product" rules={[{ required: true, message: 'Select a product' }]} style={{ flex: '1 1 240px', minWidth: 200, marginBottom: 0 }}>
                    <Select
                      showSearch
                      placeholder="Search by code or name…"
                      options={componentProductOptions}
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                    />
                  </Form.Item>
                  <Form.Item name="sequenceNo" label="Seq #" initialValue={components.length + 1} rules={[{ required: true }]} style={{ width: 64, marginBottom: 0 }}>
                    <InputNumber style={{ width: '100%' }} min={1} />
                  </Form.Item>
                  <Form.Item name="targetPct" label="Target %" rules={[{ required: true }]} style={{ width: 80, marginBottom: 0 }}>
                    <InputNumber placeholder="97" style={{ width: '100%' }} min={0} max={100} step={0.1} />
                  </Form.Item>
                  <Form.Item name="tolerancePct" label="Tolerance %" initialValue={0.5} rules={[{ required: true }]} style={{ width: 86, marginBottom: 0 }}>
                    <InputNumber placeholder="0.5" style={{ width: '100%' }} min={0} step={0.1} />
                  </Form.Item>
                  <Form.Item name="minPct" label="Min %" style={{ width: 70, marginBottom: 0 }}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.1} />
                  </Form.Item>
                  <Form.Item name="maxPct" label="Max %" style={{ width: 70, marginBottom: 0 }}>
                    <InputNumber style={{ width: '100%' }} min={0} max={100} step={0.1} />
                  </Form.Item>
                  <Form.Item
                    name="needsPositionGen"
                    label={<Tooltip title="When enabled, the position engine will generate individual positions for this component (in addition to the blended product). Disable for minor additives you track at parent level only.">
                      Position Gen <span style={{ color: '#6b7280', fontSize: 10 }}>(?)</span>
                    </Tooltip>}
                    valuePropName="checked"
                    initialValue={true}
                    style={{ width: 100, marginBottom: 0 }}
                  >
                    <Switch checkedChildren="Yes" unCheckedChildren="No" size="small" />
                  </Form.Item>
                  <div style={{ display: 'flex', gap: 4, paddingBottom: 1 }}>
                    <Button type="primary" size="small" onClick={submitAddComp} loading={addComp.isPending}>Add</Button>
                    <Button size="small" onClick={() => setShowAddComp(false)}>Cancel</Button>
                  </div>
                </div>
              </Form>
            </div>
          )}
          <Table
            size="small"
            columns={BLEND_COMPONENT_COLS((id) => removeComp.mutate(id))}
            dataSource={components}
            loading={blendLoading}
            rowKey="blendComponentId"
            pagination={false}
            footer={() => {
              const total = components.reduce((s, c) => s + c.targetPct, 0);
              return (
                <div style={{ textAlign: 'right', fontSize: 12, color: Math.abs(total - 100) < 0.01 ? '#16a34a' : '#dc2626' }}>
                  Total target: <strong>{total.toFixed(2)}%</strong>
                  {Math.abs(total - 100) < 0.01 ? ' ✓' : ' — must equal 100%'}
                </div>
              );
            }}
            locale={{ emptyText: 'No blend components defined.' }}
          />
        </div>
      )}

      {/* ── Spec Templates ──────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Typography.Text strong>
            <ExperimentOutlined style={{ marginRight: 6 }} />Quality Specification Templates
          </Typography.Text>
          <Button size="small" icon={<PlusOutlined />} onClick={() => { tplForm.resetFields(); tplForm.setFieldsValue({ isDefault: templates.length === 0 }); setTplModalOpen(true); }}>
            Add Template
          </Button>
        </div>
        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Industry-standard or internal specifications. Each template holds min/max/typical bounds for quality, physical, chemical, and safety parameters.
        </Typography.Text>
        {tplLoading ? (
          <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
        ) : !templates.length ? (
          <Empty description="No spec templates yet — click Add Template to create one." image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Collapse
            size="small"
            items={templates.map((t) => ({
              key: t.templateId,
              label: <TemplateCollapseHeader t={t} />,
              children: (
                <div>
                  <Space size={24} style={{ marginBottom: 12, flexWrap: 'wrap' }}>
                    {t.issuingBody && (
                      <Typography.Text style={{ fontSize: 11 }}>
                        <span style={{ color: '#9ca3af' }}>Issuing Body:</span>{' '}{t.issuingBody}
                      </Typography.Text>
                    )}
                    {t.version && (
                      <Typography.Text style={{ fontSize: 11 }}>
                        <span style={{ color: '#9ca3af' }}>Version:</span>{' '}{t.version}
                      </Typography.Text>
                    )}
                    {t.effectiveFrom && (
                      <Typography.Text style={{ fontSize: 11 }}>
                        <span style={{ color: '#9ca3af' }}>From:</span>{' '}{t.effectiveFrom}
                      </Typography.Text>
                    )}
                    {t.notes && (
                      <Typography.Text style={{ fontSize: 11, color: '#6b7280' }}>{t.notes}</Typography.Text>
                    )}
                  </Space>
                  <SpecTemplateValues templateId={t.templateId} commodityType={product.commodityType} />
                </div>
              ),
            }))}
          />
        )}
      </div>

      {/* ── Add Template Modal ──────────────────────────────────────────── */}
      <Modal
        title="Add Spec Template"
        open={tplModalOpen}
        onCancel={() => setTplModalOpen(false)}
        onOk={submitAddTemplate}
        okText={<Space><SaveOutlined />Add Template</Space>}
        confirmLoading={addTemplate.isPending}
        width={520}
      >
        <Form form={tplForm} layout="vertical" size="small" style={{ marginTop: 8 }}>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="templateCode" label="Template Code" rules={[{ required: true }]} style={{ flex: 1 }}>
              <Input placeholder="EN590_2022" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="version" label="Version" style={{ width: 80 }}>
              <Input placeholder="2022" />
            </Form.Item>
          </Space>
          <Form.Item name="templateName" label="Template Name" rules={[{ required: true }]}>
            <Input placeholder="EN 590 Ultra-Low Sulphur Diesel — European Road Fuel Standard" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="issuingBody" label="Issuing Body" style={{ flex: 1 }}>
              <Input placeholder="CEN / LME / ICE / Internal" />
            </Form.Item>
            <Form.Item name="standardRef" label="Standard Reference" style={{ flex: 1 }}>
              <Input placeholder="EN 590:2022+A1" />
            </Form.Item>
          </Space>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Brief description of what this template covers." />
          </Form.Item>
          <Form.Item name="isDefault" label="Default Template" valuePropName="checked">
            <Switch checkedChildren="Yes" unCheckedChildren="No" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ProductsPage() {
  const { data, isLoading, refetch } = useProducts();
  const save       = useSaveProduct();
  const deactivate = useDeactivateProduct();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing]       = useState<Product | null>(null);
  const [activeTab, setActiveTab]   = useState('details');
  const [activeCommodity, setActiveCommodity] = useState<'ALL' | CommodityType>('ALL');
  const [form] = Form.useForm<ProductInput>();

  const filtered = useMemo(
    () => (data ?? []).filter((p) => activeCommodity === 'ALL' || p.commodityType === activeCommodity),
    [data, activeCommodity],
  );

  function openNew() {
    setEditing(null);
    setActiveTab('details');
    form.resetFields();
    form.setFieldsValue({ isActive: true, isExchangeTraded: false, isOtc: true, isBlend: false });
    setDrawerOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setActiveTab('details');
    form.setFieldsValue({
      productCode:            p.productCode,
      productName:            p.productName,
      commodityId:            p.commodityId,
      commodityType:          p.commodityType,
      settlementType:         p.settlementType,
      defaultPricingTypeCode: p.defaultPricingTypeCode,
      defaultUomCode:         p.defaultUomCode,
      defaultCurrencyCode:    p.defaultCurrencyCode ?? undefined,
      defaultIncotermCode:    p.defaultIncotermCode ?? undefined,
      gradeCode:              p.gradeCode ?? undefined,
      productFamily:          p.productFamily ?? undefined,
      bloombergTicker:        p.bloombergTicker ?? undefined,
      reutersRic:             p.reutersRic ?? undefined,
      plattsCode:             p.plattsCode ?? undefined,
      isExchangeTraded:       p.isExchangeTraded,
      isOtc:                  p.isOtc,
      isBlend:                p.isBlend,
      blendNotes:             p.blendNotes ?? undefined,
      lotSize:                p.lotSize ?? undefined,
      minQuantity:            p.minQuantity ?? undefined,
      maxQuantity:            p.maxQuantity ?? undefined,
      description:            p.description ?? undefined,
      isActive:               p.isActive,
      // Pricing basis
      densityEstimateKgM3:    p.densityEstimateKgM3 ?? undefined,
      densityBaseKgM3:        p.densityBaseKgM3 ?? undefined,
      cvGrossMjScm:           p.cvGrossMjScm ?? undefined,
      cvNetMjScm:             p.cvNetMjScm ?? undefined,
      purityBasisPct:         p.purityBasisPct ?? undefined,
      moistureBasisPct:       p.moistureBasisPct ?? undefined,
      proteinBasisPct:        p.proteinBasisPct ?? undefined,
    });
    setDrawerOpen(true);
  }

  async function submit() {
    const v = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.productId ?? null, input: v });
    setEditing(saved);
    setDrawerOpen(false);
  }

  const isBlendWatched          = Form.useWatch('isBlend', form);
  const commodityTypeWatched    = Form.useWatch('commodityType', form) as CommodityType | undefined;
  const defaultUomWatched       = Form.useWatch('defaultUomCode', form) as string | undefined;
  const densityEstimateWatched  = Form.useWatch('densityEstimateKgM3', form) as number | undefined;
  const densityBaseWatched      = Form.useWatch('densityBaseKgM3', form) as number | undefined;
  const cvGrossWatched          = Form.useWatch('cvGrossMjScm', form) as number | undefined;

  // Warn when position conversion will fail at runtime
  const OIL_VOLUME_UOMS  = new Set(['BBL', 'CBM', 'GAL', 'LTR', 'M3']);
  const GAS_VOLUME_UOMS  = new Set(['SCM', 'MMSCM', 'M3', 'SCFD']);
  const needsDensity = commodityTypeWatched === 'OIL' && defaultUomWatched != null && OIL_VOLUME_UOMS.has(defaultUomWatched) && !densityEstimateWatched;
  const needsGcv     = commodityTypeWatched === 'GAS' && defaultUomWatched != null && GAS_VOLUME_UOMS.has(defaultUomWatched) && !cvGrossWatched;

  // Global same-type rates to display in Pricing Basis as commodity-level defaults
  const { data: uomConversions = [] } = useUomConversions();
  const GAS_ENERGY_UOMS = new Set(['MWH', 'MMBTU', 'GJ', 'THERM', 'BTU']);
  const oilVolumeRates  = useMemo(
    () => uomConversions.filter((c) => (c.commodityType === 'OIL' || c.commodityType === null) && OIL_VOLUME_UOMS.has(c.fromUomCode) && OIL_VOLUME_UOMS.has(c.toUomCode)),
    [uomConversions],
  );
  const gasEnergyRates  = useMemo(
    () => uomConversions.filter((c) => (c.commodityType === 'GAS' || c.commodityType === null) && GAS_ENERGY_UOMS.has(c.fromUomCode) && GAS_ENERGY_UOMS.has(c.toUomCode)),
    [uomConversions],
  );

  const colDefs = useMemo<ColDef<Product>[]>(() => [
    { field: 'productCode', headerName: 'Code', cellClass: 'cell-mono', width: 160, pinned: 'left' },
    { field: 'productName', headerName: 'Product', flex: 1.4, minWidth: 200 },
    {
      field: 'commodityType', headerName: 'Commodity', width: 115,
      cellRenderer: (p: { value: CommodityType }) => <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      field: 'settlementType', headerName: 'Settlement', width: 115,
      cellRenderer: (p: { value: SettlementType }) => <Tag color={SETTLE_COLOR[p.value]}>{p.value}</Tag>,
    },
    { field: 'productFamily',   headerName: 'Family',   width: 160,
      valueFormatter: (p) => (p.value as string | null)?.replace(/_/g, ' ') ?? '—' },
    { field: 'gradeCode',       headerName: 'Grade',    width: 120,
      valueFormatter: (p) => (p.value as string | null)?.replace(/_/g, ' ') ?? '—' },
    { field: 'defaultUomCode',  headerName: 'UoM',      width: 85, cellClass: 'cell-mono' },
    { field: 'defaultPricingTypeCode', headerName: 'Pricing', width: 110 },
    {
      headerName: 'Venue', width: 120,
      cellRenderer: (p: { data: Product }) => (
        <Space size={4}>
          {p.data.isExchangeTraded && <Tooltip title="Exchange-traded"><Tag color="purple" style={{ marginRight: 0 }}>EXCH</Tag></Tooltip>}
          {p.data.isOtc           && <Tooltip title="OTC"><Tag color="cyan" style={{ marginRight: 0 }}>OTC</Tag></Tooltip>}
        </Space>
      ),
    },
    {
      headerName: 'Vendor IDs', width: 110, sortable: false, filter: false,
      cellRenderer: (p: { data: Product }) => {
        const count = [p.data.bloombergTicker, p.data.reutersRic, p.data.plattsCode].filter(Boolean).length;
        return count > 0 ? <Tag icon={<GlobalOutlined />} color="default">{count} link{count > 1 ? 's' : ''}</Tag> : null;
      },
    },
    {
      field: 'lotSize', headerName: 'Lot Size', width: 110, cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '—',
    },
    { field: 'isActive', headerName: 'Status', width: 100, cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} /> },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: Product }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate product?"
              description="Existing trades referencing this product are unaffected."
              onConfirm={() => deactivate.mutate(p.data.productId)}
              okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  const tabItems = [
    {
      key: 'details',
      label: <Space><EditOutlined />Details</Space>,
      children: (
        <Form form={form} layout="vertical">
          {/* ── Identity ──────────────────────────────────────────────────── */}
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="productCode" label={hint('Product Code', 'Unique identifier. Convention: COMMODITY-GRADE or COMMODITY-PRODUCT.', 'OIL-DATED-BRENT')}
              style={{ flex: 1 }} rules={[{ required: true }]}>
              <Input placeholder="OIL-DATED-BRENT" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="commodityType" label="Commodity Type" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))} />
            </Form.Item>
          </Space>
          <Form.Item name="productName" label={hint('Product Name', 'Human-readable name as shown on trade confirmations and invoices.', 'Dated Brent Crude')} rules={[{ required: true }]}>
            <Input placeholder="Dated Brent Crude" />
          </Form.Item>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="productFamily" label={hint('Product Family', 'High-level grouping within commodity — e.g. CRUDE_OIL, NATURAL_GAS, BASE_METALS.', 'CRUDE_OIL')} style={{ flex: 1 }}>
              <Select options={PRODUCT_FAMILIES.map((f) => ({ label: f.replace(/_/g, ' '), value: f }))} showSearch allowClear />
            </Form.Item>
            <Form.Item name="gradeCode" label={hint('Grade / Spec', 'Product grade or specification class — e.g. LIGHT_SWEET, HEAVY_SOUR, GRADE_A.', 'LIGHT_SWEET')} style={{ flex: 1 }}>
              <Input placeholder="LIGHT_SWEET" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>
          <Form.Item name="commodityId" label={hint('Commodity ID', 'References the commodity master record for this product.', '1')} rules={[{ required: true }]}>
            <InputNumber style={{ width: 120 }} placeholder="1" min={1} />
          </Form.Item>

          {/* ── Settlement & Pricing ──────────────────────────────────────── */}
          <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
            Settlement & Pricing Defaults
          </Divider>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="settlementType" label="Settlement Type" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select options={SETTLEMENT_TYPES.map((s) => ({ label: s, value: s }))} />
            </Form.Item>
            <Form.Item name="defaultPricingTypeCode" label="Default Pricing" style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select options={PRICING_TYPE_OPTIONS.map((p) => ({ label: p, value: p }))} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="defaultUomCode" label={hint('Default UoM', 'Oil: BBL/MT. Gas: MMBTU/MCM. Power: MWH. Metals: MT/TROY_OZ. Grains: BUSHEL.', 'BBL')} style={{ flex: 1 }} rules={[{ required: true }]}>
              <Select options={UOM_OPTIONS.map((u) => ({ label: u, value: u }))} showSearch />
            </Form.Item>
            <Form.Item name="defaultCurrencyCode" label="Default Currency" style={{ flex: 1 }}>
              <Input placeholder="USD" style={{ fontFamily: 'monospace', width: 90 }} maxLength={3} />
            </Form.Item>
            <Form.Item name="defaultIncotermCode" label="Default Incoterm" style={{ flex: 1 }}>
              <Input placeholder="FOB" style={{ fontFamily: 'monospace', width: 90 }} maxLength={10} />
            </Form.Item>
          </Space>

          {/* ── Quantity constraints ──────────────────────────────────────── */}
          <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
            Quantity Constraints
          </Divider>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="lotSize" label={hint('Lot Size', 'Minimum tradeable unit. NYMEX WTI = 1,000 BBL. LME Copper = 25 MT.', '1000')} style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="1000"
                formatter={(v) => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
            <Form.Item name="minQuantity" label="Min Quantity" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="500" />
            </Form.Item>
            <Form.Item name="maxQuantity" label="Max Quantity" style={{ flex: 1 }}>
              <InputNumber style={{ width: '100%' }} placeholder="5000000" />
            </Form.Item>
          </Space>

          {/* ── Vendor Identifiers ────────────────────────────────────────── */}
          <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
            Vendor Identifiers
          </Divider>
          <Space style={{ width: '100%' }} size={12}>
            <Form.Item name="bloombergTicker" label={hint('Bloomberg Ticker', 'Bloomberg commodity ticker code (e.g. CO1 Comdty, CL1 Comdty).', 'CO1 Comdty')} style={{ flex: 1 }}>
              <Input placeholder="CO1 Comdty" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="reutersRic" label={hint('Reuters RIC', 'Refinitiv/Reuters instrument code (e.g. LCOc1, CLc1, MCUCASH=).', 'LCOc1')} style={{ flex: 1 }}>
              <Input placeholder="LCOc1" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
            <Form.Item name="plattsCode" label={hint('Platts Code', 'S&P Global / Platts price publication code or page (e.g. AAWLD00).', 'AAWLD00')} style={{ flex: 1 }}>
              <Input placeholder="AAWLD00" style={{ fontFamily: 'monospace' }} />
            </Form.Item>
          </Space>

          {/* ── Pricing Basis ─────────────────────────────────────────────── */}
          {commodityTypeWatched && (
            <>
              <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
                Pricing Basis
                <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  {commodityTypeWatched === 'OIL' && 'Product-specific density required for BBL/CBM↔MT position conversion. No commodity-level default exists — every OIL product has a different density.'}
                  {commodityTypeWatched === 'GAS' && 'Product-specific GCV required for SCM↔MWH/MMBTU conversion. No commodity-level default exists — TTF, NBP, and LNG all have different calorific values.'}
                  {commodityTypeWatched === 'METALS' && 'Minimum purity determines grade eligibility and settlement adjustment factors.'}
                  {commodityTypeWatched === 'AGRICULTURAL' && 'Moisture and protein basis govern quality allowances at delivery.'}
                </Typography.Text>
              </Divider>
              {needsDensity && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12, fontSize: 12 }}
                  message={`Density not set — ${defaultUomWatched ?? ''} → MT position conversion will fail`}
                  description="Set density below to enable cross-type conversion. Volume↔Volume rates (e.g. BBL↔GAL) are always available from the global table — shown below."
                />
              )}
              {needsGcv && (
                <Alert
                  type="warning"
                  showIcon
                  style={{ marginBottom: 12, fontSize: 12 }}
                  message={`GCV not set — ${defaultUomWatched ?? ''} → MWh position conversion will fail`}
                  description="Set GCV below to enable volume→energy conversion. Energy↔Energy rates (e.g. MWh↔MMBTU) are always available from the global table — shown below."
                />
              )}
              {commodityTypeWatched === 'OIL' && (
                <>
                  {oilVolumeRates.length > 0 && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                        Volume ↔ Volume (exact physical constants, same for every OIL product — stored in UoM Conversions):
                      </Typography.Text>
                      <div style={{ display: 'flex', gap: 24, marginTop: 4, flexWrap: 'wrap' }}>
                        {oilVolumeRates.map((r) => {
                          const n = Number(r.factor);
                          const display = n >= 1000
                            ? n.toLocaleString(undefined, { maximumFractionDigits: 4 })
                            : n.toPrecision(6).replace(/\.?0+$/, '');
                          return (
                            <code key={r.conversionId} style={{ fontSize: 12 }}>
                              1 {r.fromUomCode} = {display} {r.toUomCode}
                            </code>
                          );
                        })}
                      </div>
                      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                        Volume ↔ Weight (e.g. BBL → MT) cannot be a universal constant — it depends on this product's density. Set it below.
                      </Typography.Text>
                    </div>
                  )}
                  <Space style={{ width: '100%' }} size={12}>
                    <Form.Item name="densityEstimateKgM3"
                      label={hint('Density Estimate (kg/m³)', 'Working density used at trade entry to convert BBL↔MT for risk positions. Adjusted at invoice if cargo differs.', '857.0')}
                      style={{ flex: 1 }}>
                      <InputNumber style={{ width: '100%' }} placeholder="857.0" min={600} max={1100} step={0.1} addonAfter="kg/m³" />
                    </Form.Item>
                    <Form.Item name="densityBaseKgM3"
                      label={hint('Density Base (kg/m³)', 'Contractual reference density for invoice/settlement BBL↔MT conversion. Often the published EI-CLMS or loading port figure.', '836.0')}
                      style={{ flex: 1 }}>
                      <InputNumber style={{ width: '100%' }} placeholder="836.0" min={600} max={1100} step={0.1} addonAfter="kg/m³" />
                    </Form.Item>
                  </Space>
                  {/* Product-specific cross-type rates derived from density — shown in real time */}
                  {(densityEstimateWatched || densityBaseWatched) && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12 }}>
                      <Typography.Text strong style={{ fontSize: 12, color: '#166534' }}>
                        Product-specific cross-type rates (overrides commodity defaults where applicable):
                      </Typography.Text>
                      <div style={{ display: 'flex', gap: 32, marginTop: 4, flexWrap: 'wrap' }}>
                        {densityEstimateWatched && (
                          <Space direction="vertical" size={1}>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Estimate — position / risk</Typography.Text>
                            <code style={{ fontSize: 12 }}>
                              1 BBL = {(densityEstimateWatched * 0.000158987).toFixed(6)} MT
                            </code>
                            <code style={{ fontSize: 12 }}>
                              1 MT = {(1 / (densityEstimateWatched * 0.000158987)).toFixed(4)} BBL
                            </code>
                          </Space>
                        )}
                        {densityBaseWatched && (
                          <Space direction="vertical" size={1}>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>Base — settlement / invoice</Typography.Text>
                            <code style={{ fontSize: 12 }}>
                              1 BBL = {(densityBaseWatched * 0.000158987).toFixed(6)} MT
                            </code>
                            <code style={{ fontSize: 12 }}>
                              1 MT = {(1 / (densityBaseWatched * 0.000158987)).toFixed(4)} BBL
                            </code>
                          </Space>
                        )}
                      </div>
                      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                        Effective factor = density (kg/m³) × 0.000158987 m³/BBL. Unique per crude grade.
                      </Typography.Text>
                    </div>
                  )}
                </>
              )}
              {commodityTypeWatched === 'GAS' && (
                <>
                  {gasEnergyRates.length > 0 && (
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '8px 12px', marginBottom: 12 }}>
                      <Typography.Text type="secondary" style={{ fontSize: 11, fontWeight: 600 }}>
                        Energy ↔ Energy (exact physical constants, same for every GAS product — stored in UoM Conversions):
                      </Typography.Text>
                      <div style={{ display: 'flex', gap: 24, marginTop: 4, flexWrap: 'wrap' }}>
                        {gasEnergyRates.map((r) => {
                          const n = Number(r.factor);
                          const display = n >= 1000
                            ? n.toLocaleString(undefined, { maximumFractionDigits: 4 })
                            : n.toPrecision(6).replace(/\.?0+$/, '');
                          return (
                            <code key={r.conversionId} style={{ fontSize: 12 }}>
                              1 {r.fromUomCode} = {display} {r.toUomCode}
                            </code>
                          );
                        })}
                      </div>
                      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                        SCM → MWh requires product GCV below (varies per gas stream — TTF ≈ 10.7, NBP ≈ 10.97 MJ/scm).
                      </Typography.Text>
                    </div>
                  )}
                  <Space style={{ width: '100%' }} size={12}>
                    <Form.Item name="cvGrossMjScm"
                      label={hint('GCV (MJ/scm)', 'Gross Calorific Value used to convert SCM↔MWH and SCM↔MMBTU. H-Gas ≈ 38.0, NBP ≈ 39.5, LNG ≈ 40–43.', '38.0')}
                      style={{ flex: 1 }}>
                      <InputNumber style={{ width: '100%' }} placeholder="38.0" min={20} max={60} step={0.01} addonAfter="MJ/scm" />
                    </Form.Item>
                    <Form.Item name="cvNetMjScm"
                      label={hint('NCV (MJ/scm)', 'Net Calorific Value (lower heating value). Used for net-heat efficiency calculations. Typically 90–92% of GCV.', '34.2')}
                      style={{ flex: 1 }}>
                      <InputNumber style={{ width: '100%' }} placeholder="34.2" min={20} max={60} step={0.01} addonAfter="MJ/scm" />
                    </Form.Item>
                  </Space>
                  {/* Product-specific volume→energy rates from GCV — shown in real time */}
                  {cvGrossWatched && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 6, padding: '8px 12px', marginBottom: 12, fontSize: 12 }}>
                      <Typography.Text strong style={{ fontSize: 12, color: '#166534' }}>
                        Product-specific cross-type rates (GCV {cvGrossWatched} MJ/scm — SCM ↔ energy):
                      </Typography.Text>
                      <div style={{ display: 'flex', gap: 32, marginTop: 4, flexWrap: 'wrap' }}>
                        <Space direction="vertical" size={1}>
                          <code style={{ fontSize: 12 }}>1 SCM = {(cvGrossWatched / 3600).toFixed(6)} MWh</code>
                          <code style={{ fontSize: 12 }}>1 SCM = {(cvGrossWatched / 1055.056).toFixed(6)} MMBTU</code>
                        </Space>
                        <Space direction="vertical" size={1}>
                          <code style={{ fontSize: 12 }}>1 MWh = {(3600 / cvGrossWatched).toFixed(4)} SCM</code>
                          <code style={{ fontSize: 12 }}>1 MMBTU = {(1055.056 / cvGrossWatched).toFixed(4)} SCM</code>
                        </Space>
                      </div>
                      <Typography.Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                        GCV ÷ 3600 = MWh/scm · GCV ÷ 1055.056 = MMBTU/scm. Unique per gas stream.
                      </Typography.Text>
                    </div>
                  )}
                </>
              )}
              {commodityTypeWatched === 'METALS' && (
                <Form.Item name="purityBasisPct"
                  label={hint('Purity Basis (%)', 'Minimum acceptable purity % defining the contract grade. LME Copper = 99.9935, LME Aluminium = 99.7.', '99.9935')}
                  style={{ maxWidth: 280 }}>
                  <InputNumber style={{ width: '100%' }} placeholder="99.9935" min={50} max={100} step={0.0001} precision={4} addonAfter="%" />
                </Form.Item>
              )}
              {commodityTypeWatched === 'AGRICULTURAL' && (
                <Space style={{ width: '100%' }} size={12}>
                  <Form.Item name="moistureBasisPct"
                    label={hint('Moisture Basis (%)', 'Contract moisture % — quality allowances apply if out-turn moisture differs. Wheat ≈ 14%, Corn ≈ 14%, Soybeans ≈ 13%.', '14.0')}
                    style={{ flex: 1 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="14.0" min={0} max={40} step={0.1} addonAfter="%" />
                  </Form.Item>
                  <Form.Item name="proteinBasisPct"
                    label={hint('Protein Basis (%)', 'Contract protein % — premium/discount schedule applied at delivery. Wheat ≈ 10.5–11.5%, Soymeal ≈ 46–48%.', '10.5')}
                    style={{ flex: 1 }}>
                    <InputNumber style={{ width: '100%' }} placeholder="10.5" min={0} max={60} step={0.1} addonAfter="%" />
                  </Form.Item>
                </Space>
              )}
            </>
          )}

          {/* ── Flags ─────────────────────────────────────────────────────── */}
          <Divider orientation="left" orientationMargin={0} style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
            Trading Venue Flags
          </Divider>
          <Space size={32}>
            <Form.Item name="isExchangeTraded" label="Exchange-Traded" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isOtc" label="OTC" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isBlend" label={hint('Blend Product', 'Enable if this product is manufactured by blending two or more component products (e.g. GAS97 = ULSD + Ethanol). Unlocks the Quality Specs tab where you can define the blend recipe.', 'Off')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="isActive" label="Active" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Space>

          {isBlendWatched && (
            <Form.Item name="blendNotes" label={hint('Blend Notes', 'Recipe summary shown on the Specs tab and trade confirmations for blended products.', '97%vol ULSD + 3%vol Ethanol')}>
              <Input.TextArea rows={2} placeholder="97%vol ULSD-10PPM + 3%vol Denatured Ethanol — EN228 Euro-5 compliant" />
            </Form.Item>
          )}

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} placeholder="Product description, trading context, and any important notes" />
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'price-indices',
      label: <Space><BarChartOutlined />Price Indices{editing ? <Badge count={0} showZero={false} /> : null}</Space>,
      disabled: editing === null,
      children: editing ? <PriceIndicesTab productId={editing.productId} /> : null,
    },
    {
      key: 'markets',
      label: <Space><GlobalOutlined />Markets</Space>,
      disabled: editing === null,
      children: editing ? <MarketsTab productId={editing.productId} /> : null,
    },
    {
      key: 'specs',
      label: (
        <Space>
          <ExperimentOutlined />
          Quality Specs
          {editing?.isBlend && <Tag color="blue" style={{ margin: 0, fontSize: 10 }}>Blend</Tag>}
        </Space>
      ),
      disabled: editing === null,
      children: editing ? <SpecsTab product={editing} isBlend={isBlendWatched ?? editing.isBlend} /> : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Products"
        description="Tradeable products — defines commodity, settlement type, default pricing, vendor identifiers, quantity constraints, and links to price indices and markets."
        moduleGroup="markets"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={filtered}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Product"
        commodityFilter
        activeCommodity={activeCommodity}
        onCommodityChange={(c) => setActiveCommodity(c as 'ALL' | CommodityType)}
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.productId)}
      />

      <Drawer
        title={editing ? `Edit Product — ${editing.productCode}` : 'New Product'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={680}
        footer={
          activeTab === 'details' ? (
            <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
              <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
              <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
            </Space>
          ) : null
        }
        styles={{ body: { padding: 0 } }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ padding: '0 24px 24px' }}
          tabBarStyle={{ marginBottom: 16, paddingTop: 12 }}
        />
      </Drawer>
    </>
  );
}
