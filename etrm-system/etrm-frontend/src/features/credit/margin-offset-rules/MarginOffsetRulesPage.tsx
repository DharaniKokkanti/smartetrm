import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Table, Typography, Select, Form, InputNumber, DatePicker, Card } from 'antd';
import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { ActiveTag } from '@components/smart/StatusTag';
import { color } from '@theme/tokens';
import { useExchanges } from '@features/markets/exchanges/hooks';
import {
  useMarginOffsetRules,
  useSaveMarginOffsetRule,
  useDeactivateMarginOffsetRule,
  useMarketProductLinks,
} from './hooks';
import type { MarginOffsetRule, MarginOffsetRuleInput } from './types';

export function MarginOffsetRulesPage() {
  const { data: exchanges = [] } = useExchanges();
  const { data: links = [] } = useMarketProductLinks();
  const [exchangeId, setExchangeId] = useState<number | null>(null);
  const { data = [], isLoading } = useMarginOffsetRules(exchangeId);
  const save = useSaveMarginOffsetRule(exchangeId);
  const deactivate = useDeactivateMarginOffsetRule(exchangeId);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const exchangeOpts = useMemo(
    () => exchanges.map((e) => ({ value: e.exchangeId, label: `${e.exchangeCode} — ${e.exchangeName}` })),
    [exchanges],
  );
  const legOpts = useMemo(
    () => links.map((l) => ({ value: l.marketProductLinkId, label: l.ticker ?? `#${l.marketProductLinkId}` })),
    [links],
  );

  async function submit() {
    const v = await form.validateFields();
    const input: MarginOffsetRuleInput = {
      ...v,
      exchangeId,
      effectiveFrom: v.effectiveFrom.format('YYYY-MM-DD'),
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
      rowVersion: 0,
    };
    await save.mutateAsync({ id: null, input });
    setAddOpen(false);
    form.resetFields();
  }

  const cols = [
    { title: 'Leg 1', dataIndex: 'leg1Label', width: 140 },
    { title: 'Leg 2', dataIndex: 'leg2Label', width: 140 },
    { title: 'Ratio 1:2', width: 100, render: (_: unknown, r: MarginOffsetRule) => `${r.offsetRatioLeg1}:${r.offsetRatioLeg2}` },
    { title: 'IM Reduction', dataIndex: 'imReductionPct', width: 110, align: 'right' as const, render: (v: number) => `${v}%` },
    { title: 'Effective From', dataIndex: 'effectiveFrom', width: 110 },
    { title: 'Effective To', dataIndex: 'effectiveTo', width: 110, render: (v: string | null) => v ?? '—' },
    { title: 'Active', dataIndex: 'isActive', width: 70, render: (v: boolean) => <ActiveTag active={v} /> },
    {
      title: '', width: 60, render: (_: unknown, r: MarginOffsetRule) => r.isActive && (
        <Popconfirm title="Deactivate this offset rule?" onConfirm={() => deactivate.mutate(r.marginOffsetRuleId)} okText="Deactivate" okButtonProps={{ danger: true }}>
          <Button type="text" size="small" danger icon={<StopOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Margin Offset Rules"
        description="Inter-commodity margin offset/netting rules (spark, dark, and crack spreads) published per exchange — an IM reduction applied when two related listed contracts are held together."
        moduleGroup="credit"
      />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space align="center">
          <Typography.Text strong>Exchange:</Typography.Text>
          <Select
            style={{ width: 360 }}
            placeholder="Select an exchange to view/manage its offset rules"
            options={exchangeOpts}
            showSearch
            optionFilterProp="label"
            value={exchangeId}
            onChange={setExchangeId}
          />
        </Space>
      </Card>

      {exchangeId === null ? (
        <Typography.Text type="secondary">Select an exchange above to view its margin offset rules.</Typography.Text>
      ) : (
        <Table
          size="small"
          columns={cols}
          dataSource={data}
          loading={isLoading}
          rowKey="marginOffsetRuleId"
          pagination={false}
          locale={{ emptyText: 'No offset rules yet for this exchange.' }}
          footer={() => (
            <Button size="small" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Offset Rule</Button>
          )}
        />
      )}

      {addOpen && exchangeId !== null && (
        <div style={{ marginTop: 12, padding: 16, border: `1px solid ${color.border}`, borderRadius: 6 }}>
          <Form form={form} layout="vertical" initialValues={{ offsetRatioLeg1: 1, offsetRatioLeg2: 1, isActive: true }}>
            <Space style={{ width: '100%', gap: 12 }} wrap>
              <Form.Item name="leg1MarketProductLinkId" label="Leg 1" rules={[{ required: true }]} style={{ width: 200 }}>
                <Select options={legOpts} showSearch optionFilterProp="label" />
              </Form.Item>
              <Form.Item name="leg2MarketProductLinkId" label="Leg 2" rules={[{ required: true }]} style={{ width: 200 }}>
                <Select options={legOpts} showSearch optionFilterProp="label" />
              </Form.Item>
              <Form.Item name="offsetRatioLeg1" label="Ratio Leg 1" rules={[{ required: true }]} style={{ width: 110 }}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
              <Form.Item name="offsetRatioLeg2" label="Ratio Leg 2" rules={[{ required: true }]} style={{ width: 110 }}>
                <InputNumber style={{ width: '100%' }} min={0} step={0.1} />
              </Form.Item>
              <Form.Item name="imReductionPct" label="IM Reduction %" rules={[{ required: true }]} style={{ width: 130 }}>
                <InputNumber style={{ width: '100%' }} min={0} max={100} />
              </Form.Item>
              <Form.Item name="effectiveFrom" label="Effective From" rules={[{ required: true }]} initialValue={dayjs()} style={{ width: 150 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="effectiveTo" label="Effective To" style={{ width: 150 }}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Space>
            <Space style={{ marginTop: 8 }}>
              <Button size="small" onClick={() => { setAddOpen(false); form.resetFields(); }}>Cancel</Button>
              <Button size="small" type="primary" onClick={() => { void submit(); }} loading={save.isPending}>Add</Button>
            </Space>
          </Form>
        </div>
      )}
    </>
  );
}
