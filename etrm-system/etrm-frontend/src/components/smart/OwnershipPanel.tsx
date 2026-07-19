import { useState } from 'react';
import {
  Button, Empty, Form, Input, InputNumber, Select, Switch, Table, Tag, Tooltip, Typography, Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { AppDatePicker } from '@components/smart/AppDatePicker';

/**
 * Shared shape behind both dbo.legal_entity_ownership (V125) and
 * dbo.book_ownership (V126) — a resource co-owned by 2+ parties at %, one
 * of three owner cases (LEGAL_ENTITY/COUNTERPARTY resolve via a real FK,
 * EXTERNAL is a free-text fallback), an operator flag, and a per-owner
 * consolidation method. The two tables are deliberately independent (a
 * book can carry a split regardless of its parent legal entity's own
 * ownership/entity_type — see V126's migration header) but share an
 * identical row/input shape, so this component is the one place the
 * table + inline add-form + advisory-total UI is written, parameterized
 * by which parent resource it's attached to.
 */
export type OwnerType = 'LEGAL_ENTITY' | 'COUNTERPARTY' | 'EXTERNAL';
export type ConsolidationMethod = 'FULL' | 'PROPORTIONAL' | 'EQUITY' | 'COST';

export interface OwnershipRow {
  ownerType: OwnerType;
  ownerRefId: number | null;
  externalOwnerName: string | null;
  ownerDisplayName: string;
  ownershipPct: number;
  isOperator: boolean;
  consolidationMethod: ConsolidationMethod;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
}

export interface OwnershipInput {
  ownerType: OwnerType;
  ownerRefId: number | null;
  externalOwnerName: string | null;
  ownershipPct: number;
  isOperator: boolean;
  consolidationMethod: ConsolidationMethod;
  effectiveFrom: string;
  effectiveTo: string | null;
  notes: string | null;
}

interface Props<TRow extends OwnershipRow> {
  /** null before the parent record's first save — shows a guard instead of the table. */
  parentId: number | null;
  emptyBeforeSaveMessage: string;
  rows: TRow[] | undefined;
  totalActiveOwnershipPct: number | undefined;
  isLoading: boolean;
  rowKey: (row: TRow) => number;
  onAdd: (input: OwnershipInput) => Promise<unknown>;
  addPending: boolean;
  onRemove: (row: TRow) => void;
  removePending: boolean;
  legalEntityOptions: { label: string; value: number }[];
  counterpartyOptions: { label: string; value: number }[];
}

const OWNER_TYPE_OPTIONS: { label: string; value: OwnerType }[] = [
  { label: 'Legal Entity (internal)', value: 'LEGAL_ENTITY' },
  { label: 'Counterparty', value: 'COUNTERPARTY' },
  { label: 'External (not otherwise modeled)', value: 'EXTERNAL' },
];

const CONSOLIDATION_OPTIONS: { label: string; value: ConsolidationMethod }[] = [
  { label: 'Full', value: 'FULL' },
  { label: 'Proportional', value: 'PROPORTIONAL' },
  { label: 'Equity', value: 'EQUITY' },
  { label: 'Cost', value: 'COST' },
];

const CONSOLIDATION_HINT =
  'How the OWNER consolidates this stake in its own books/financials — Full (control, consolidate 100% + NCI), ' +
  'Proportional (pro-rata share of every line), Equity (single net investment line), Cost (carried at cost, income only on distributions).';

type AddFormValues = {
  ownerType: OwnerType;
  ownerRefId?: number;
  externalOwnerName?: string;
  ownershipPct: number;
  isOperator: boolean;
  consolidationMethod: ConsolidationMethod;
  effectiveFrom: dayjs.Dayjs;
  notes?: string;
};

function ownershipColumns<TRow extends OwnershipRow>(onRemove: (row: TRow) => void): ColumnsType<TRow> {
  return [
    {
      title: 'Owner', dataIndex: 'ownerDisplayName', width: 200,
      render: (v: string, r) => (
        <div>
          <Typography.Text>{v}</Typography.Text>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{r.ownerType}</div>
        </div>
      ),
    },
    {
      title: '%', dataIndex: 'ownershipPct', width: 80, align: 'right' as const,
      render: (v: number) => <strong>{v}%</strong>,
    },
    {
      title: 'Operator', dataIndex: 'isOperator', width: 90, align: 'center' as const,
      render: (v: boolean) => (v ? <Tag color="blue">Operator</Tag> : null),
    },
    { title: 'Consolidation', dataIndex: 'consolidationMethod', width: 110 },
    {
      title: 'Effective From', dataIndex: 'effectiveFrom', width: 110,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD'),
    },
    {
      title: '', width: 50, align: 'center' as const,
      render: (_: unknown, r) => (
        <Popconfirm title="Remove this ownership row?" onConfirm={() => onRemove(r)}
          okText="Remove" okButtonProps={{ danger: true }}>
          <Button type="text" size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];
}

export function OwnershipPanel<TRow extends OwnershipRow>({
  parentId, emptyBeforeSaveMessage, rows, totalActiveOwnershipPct, isLoading, rowKey,
  onAdd, addPending, onRemove, removePending, legalEntityOptions, counterpartyOptions,
}: Props<TRow>) {
  const [form] = Form.useForm<AddFormValues>();
  const [showAdd, setShowAdd] = useState(false);
  const ownerTypeWatched = Form.useWatch('ownerType', form);

  if (parentId === null) {
    return <Empty description={emptyBeforeSaveMessage} />;
  }

  const rowsSafe = rows ?? [];
  const total = totalActiveOwnershipPct ?? 0;

  async function submitAdd() {
    const v = await form.validateFields();
    const input: OwnershipInput = {
      ownerType: v.ownerType,
      ownerRefId: v.ownerType === 'EXTERNAL' ? null : (v.ownerRefId ?? null),
      externalOwnerName: v.ownerType === 'EXTERNAL' ? (v.externalOwnerName ?? null) : null,
      ownershipPct: v.ownershipPct,
      isOperator: v.isOperator ?? false,
      consolidationMethod: v.consolidationMethod,
      effectiveFrom: v.effectiveFrom.format('YYYY-MM-DD'),
      effectiveTo: null,
      notes: v.notes ?? null,
    };
    await onAdd(input);
    form.resetFields();
    setShowAdd(false);
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Typography.Text strong>Ownership</Typography.Text>
        <Button size="small" icon={<PlusOutlined />} onClick={() => setShowAdd(!showAdd)}>
          Add Owner
        </Button>
      </div>

      {showAdd && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 12 }}>
          <Form form={form} layout="vertical" size="small" initialValues={{
            ownerType: 'LEGAL_ENTITY', isOperator: false, consolidationMethod: 'EQUITY', effectiveFrom: dayjs(),
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'flex-end' }}>
              <Form.Item name="ownerType" label="Owner Type" rules={[{ required: true }]} style={{ width: 200, marginBottom: 0 }}>
                <Select options={OWNER_TYPE_OPTIONS} />
              </Form.Item>
              {ownerTypeWatched === 'LEGAL_ENTITY' && (
                <Form.Item name="ownerRefId" label="Legal Entity" rules={[{ required: true, message: 'Select an owner' }]} style={{ flex: '1 1 200px', minWidth: 200, marginBottom: 0 }}>
                  <Select showSearch placeholder="Search…" options={legalEntityOptions} optionFilterProp="label" style={{ width: '100%' }} />
                </Form.Item>
              )}
              {ownerTypeWatched === 'COUNTERPARTY' && (
                <Form.Item name="ownerRefId" label="Counterparty" rules={[{ required: true, message: 'Select an owner' }]} style={{ flex: '1 1 200px', minWidth: 200, marginBottom: 0 }}>
                  <Select showSearch placeholder="Search…" options={counterpartyOptions} optionFilterProp="label" style={{ width: '100%' }} />
                </Form.Item>
              )}
              {ownerTypeWatched === 'EXTERNAL' && (
                <Form.Item name="externalOwnerName" label="Owner Name" rules={[{ required: true, message: 'Required' }, { max: 200 }]} style={{ flex: '1 1 200px', minWidth: 200, marginBottom: 0 }}>
                  <Input placeholder="e.g. IFM Investors" />
                </Form.Item>
              )}
              <Form.Item name="ownershipPct" label="Ownership %" rules={[{ required: true, message: 'Required' }]} style={{ width: 100, marginBottom: 0 }}>
                <InputNumber min={0.001} max={100} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="consolidationMethod" label={<Tooltip title={CONSOLIDATION_HINT}>Consolidation <span style={{ color: '#6b7280', fontSize: 10 }}>(?)</span></Tooltip>} rules={[{ required: true }]} style={{ width: 140, marginBottom: 0 }}>
                <Select options={CONSOLIDATION_OPTIONS} />
              </Form.Item>
              <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]} style={{ width: 140, marginBottom: 0 }}>
                <AppDatePicker />
              </Form.Item>
              <Form.Item name="isOperator" label="Operator" valuePropName="checked" style={{ width: 80, marginBottom: 0 }}>
                <Switch size="small" />
              </Form.Item>
              <Form.Item name="notes" label="Notes" style={{ flex: '1 1 160px', minWidth: 140, marginBottom: 0 }}>
                <Input placeholder="Optional" />
              </Form.Item>
              <div style={{ display: 'flex', gap: 4, paddingBottom: 1 }}>
                <Button type="primary" size="small" onClick={submitAdd} loading={addPending}>Add</Button>
                <Button size="small" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </div>
          </Form>
        </div>
      )}

      <Table
        size="small"
        columns={ownershipColumns<TRow>(onRemove)}
        dataSource={rowsSafe}
        loading={isLoading || removePending}
        rowKey={rowKey}
        pagination={false}
        footer={() => (
          <div style={{ textAlign: 'right', fontSize: 12, color: Math.abs(total - 100) < 0.01 ? '#16a34a' : '#dc2626' }}>
            Total active ownership: <strong>{total.toFixed(3)}%</strong>
            {Math.abs(total - 100) < 0.01 ? ' ✓' : ' — does not total 100%'}
          </div>
        )}
        locale={{ emptyText: 'No ownership rows defined yet.' }}
      />
    </div>
  );
}
