import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Table, Typography, Select, Form, InputNumber, DatePicker, Card } from 'antd';
import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { ActiveTag } from '@components/smart/StatusTag';
import { color } from '@theme/tokens';
import { useTableRows } from '@features/tier2/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useContractMarginRates, useSaveContractMarginRate, useDeactivateContractMarginRate } from './hooks';
import { TENOR_BUCKETS, MARGIN_UNIT_TYPES, type ContractMarginRate, type ContractMarginRateInput } from './types';

interface ContractSpecRow { contractSpecId: number; specCode: string; specName: string; }

export function ContractMarginRatesPage() {
  const { data: specs = [] } = useTableRows<ContractSpecRow>('derivative_contract_specification');
  const { data: currencies = [] } = useCurrencies();
  const [contractSpecId, setContractSpecId] = useState<number | null>(null);
  const { data = [], isLoading } = useContractMarginRates(contractSpecId);
  const save = useSaveContractMarginRate(contractSpecId);
  const deactivate = useDeactivateContractMarginRate(contractSpecId);
  const [addOpen, setAddOpen] = useState(false);
  const [form] = Form.useForm();

  const specOpts = useMemo(
    () => specs.map((s) => ({ value: s.contractSpecId, label: `${s.specCode} — ${s.specName}` })),
    [specs],
  );
  const currencyOpts = useMemo(
    () => (currencies as { currencyId: number; currencyCode: string }[]).map((c) => ({ value: c.currencyId, label: c.currencyCode })),
    [currencies],
  );

  async function submit() {
    const v = await form.validateFields();
    const input: ContractMarginRateInput = {
      ...v,
      contractSpecId,
      effectiveFrom: v.effectiveFrom.format('YYYY-MM-DD'),
      effectiveTo: v.effectiveTo ? v.effectiveTo.format('YYYY-MM-DD') : null,
      rowVersion: 0,
    };
    await save.mutateAsync({ id: null, input });
    setAddOpen(false);
    form.resetFields();
  }

  const cols = [
    { title: 'Tenor', dataIndex: 'tenorBucket', width: 110 },
    { title: 'Unit', dataIndex: 'marginUnitType', width: 100 },
    {
      title: 'Initial Margin', dataIndex: 'initialMarginRate', width: 140, align: 'right' as const,
      render: (v: number, r: ContractMarginRate) => `${r.marginCurrencyCode ?? ''} ${v.toLocaleString()}`,
    },
    {
      title: 'Maintenance Margin', dataIndex: 'maintenanceMarginRate', width: 150, align: 'right' as const,
      render: (v: number, r: ContractMarginRate) => `${r.marginCurrencyCode ?? ''} ${v.toLocaleString()}`,
    },
    { title: 'Effective From', dataIndex: 'effectiveFrom', width: 110 },
    { title: 'Effective To', dataIndex: 'effectiveTo', width: 110, render: (v: string | null) => v ?? '—' },
    { title: 'Active', dataIndex: 'isActive', width: 70, render: (v: boolean) => <ActiveTag active={v} /> },
    {
      title: '', width: 60, render: (_: unknown, r: ContractMarginRate) => r.isActive && (
        <Popconfirm title="Deactivate this margin rate?" onConfirm={() => deactivate.mutate(r.contractMarginRateId)} okText="Deactivate" okButtonProps={{ danger: true }}>
          <Button type="text" size="small" danger icon={<StopOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Contract Margin Rates"
        description="Exchange-published initial/maintenance margin rate per derivative contract spec, effective-dated. This is the baseline rate a clearing account's House Margin Rate (on the Clearing Accounts page) can override."
        moduleGroup="credit"
      />
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space align="center">
          <Typography.Text strong>Contract Spec:</Typography.Text>
          <Select
            style={{ width: 360 }}
            placeholder="Select a contract spec to view/manage its margin rates"
            options={specOpts}
            showSearch
            optionFilterProp="label"
            value={contractSpecId}
            onChange={setContractSpecId}
          />
        </Space>
      </Card>

      {contractSpecId === null ? (
        <Typography.Text type="secondary">Select a contract spec above to view its margin rates.</Typography.Text>
      ) : (
        <Table
          size="small"
          columns={cols}
          dataSource={data}
          loading={isLoading}
          rowKey="contractMarginRateId"
          pagination={false}
          locale={{ emptyText: 'No margin rates yet for this contract spec.' }}
          footer={() => (
            <Button size="small" icon={<PlusOutlined />} onClick={() => setAddOpen(true)}>Add Margin Rate</Button>
          )}
        />
      )}

      {addOpen && contractSpecId !== null && (
        <div style={{ marginTop: 12, padding: 16, border: `1px solid ${color.border}`, borderRadius: 6 }}>
          <Form form={form} layout="vertical" initialValues={{ tenorBucket: 'ALL', marginUnitType: 'PER_LOT', isCurrent: true, isActive: true }}>
            <Space style={{ width: '100%', gap: 12 }} wrap>
              <Form.Item name="tenorBucket" label="Tenor" style={{ width: 130 }}>
                <Select options={TENOR_BUCKETS.map((t) => ({ value: t, label: t }))} />
              </Form.Item>
              <Form.Item name="marginUnitType" label="Unit" style={{ width: 130 }}>
                <Select options={MARGIN_UNIT_TYPES.map((u) => ({ value: u, label: u }))} />
              </Form.Item>
              <Form.Item name="marginCurrencyId" label="Currency" rules={[{ required: true }]} style={{ width: 110 }}>
                <Select options={currencyOpts} />
              </Form.Item>
              <Form.Item name="initialMarginRate" label="Initial Margin" rules={[{ required: true }]} style={{ width: 140 }}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
              <Form.Item name="maintenanceMarginRate" label="Maintenance Margin" rules={[{ required: true }]} style={{ width: 150 }}>
                <InputNumber style={{ width: '100%' }} min={0} />
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
