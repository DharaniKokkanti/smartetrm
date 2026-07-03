import { useMemo, useState } from 'react';
import { Card, Col, Row, Tag, Typography, Progress, Space, Statistic, Table, Button, Tooltip, Badge } from 'antd';
import { SyncOutlined, LineChartOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@components/layout/PageHeader';

const { Text } = Typography;

interface BalmoPosition {
  orderId: number;
  orderReference: string;
  tradeReference: string;
  counterpartyName: string;
  direction: 'BUY' | 'SELL';
  quantity: number;
  uomCode: string;
  currencyCode: string;
  contractMonth: string;
  contractSeries: string;
  exchange: string;
  settlementPriceTicker: string;
  pricingStartDate: string;
  pricingEndDate: string;
  balmoStatus: 'ACTIVE' | 'PRICING_COMPLETE' | 'SETTLED';
  elapsedPricingDays: number | null;
  totalPricingDays: number | null;
  runningAvgPrice: number | null;
  finalSettledPrice: number | null;
  bookCode: string;
  commodityType: string;
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'processing', PRICING_COMPLETE: 'warning', SETTLED: 'success',
};

const DIRECTION_COLOR: Record<string, string> = { BUY: 'success', SELL: 'error' };

function pctElapsed(pos: BalmoPosition): number {
  if (!pos.elapsedPricingDays || !pos.totalPricingDays || pos.totalPricingDays === 0) return 0;
  return Math.round((pos.elapsedPricingDays / pos.totalPricingDays) * 100);
}

export function BalmoDashboardPage() {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data: positions = [], isLoading, refetch } = useQuery<BalmoPosition[]>({
    queryKey: ['balmo-positions'],
    queryFn: () => fetch('/api/pricing/balmo-positions').then((r) => r.json() as Promise<BalmoPosition[]>),
  });

  async function refreshAvg(orderId: number) {
    setUpdatingId(orderId);
    try {
      await fetch(`/api/pricing/balmo-positions/${orderId}/update-avg`, { method: 'PATCH' });
      await refetch();
    } finally {
      setUpdatingId(null);
    }
  }

  const active = useMemo(() => positions.filter((p) => p.balmoStatus === 'ACTIVE'), [positions]);
  const completed = useMemo(() => positions.filter((p) => p.balmoStatus !== 'ACTIVE'), [positions]);

  const totalBuy = useMemo(() =>
    active.filter((p) => p.direction === 'BUY').reduce((s, p) => s + p.quantity, 0),
    [active],
  );
  const totalSell = useMemo(() =>
    active.filter((p) => p.direction === 'SELL').reduce((s, p) => s + p.quantity, 0),
    [active],
  );

  const columns = [
    { title: 'Order', dataIndex: 'orderReference', width: 165, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Trade', dataIndex: 'tradeReference', width: 135, render: (v: string) => <Text style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Counterparty', dataIndex: 'counterpartyName', ellipsis: true },
    {
      title: 'B/S', dataIndex: 'direction', width: 58,
      render: (v: string) => <Tag color={DIRECTION_COLOR[v]} style={{ fontWeight: 700 }}>{v}</Tag>,
    },
    {
      title: 'Qty / UoM', width: 120,
      render: (_: unknown, r: BalmoPosition) => (
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>{r.quantity.toLocaleString()} {r.uomCode}</Text>
      ),
    },
    { title: 'Series', dataIndex: 'contractSeries', width: 70, render: (v: string) => <Tag style={{ fontSize: 10 }}>{v}</Tag> },
    { title: 'Month', dataIndex: 'contractMonth', width: 90, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    { title: 'Settle Ticker', dataIndex: 'settlementPriceTicker', width: 110, render: (v: string) => <Text code style={{ fontSize: 11 }}>{v}</Text> },
    {
      title: 'Pricing Progress', width: 180,
      render: (_: unknown, r: BalmoPosition) => {
        const pct = pctElapsed(r);
        return r.totalPricingDays ? (
          <Space direction="vertical" size={0} style={{ width: '100%' }}>
            <Progress percent={pct} size="small" strokeColor={pct < 50 ? '#1677ff' : pct < 80 ? '#faad14' : '#52c41a'} style={{ marginBottom: 0 }} />
            <Text type="secondary" style={{ fontSize: 10 }}>
              {r.elapsedPricingDays ?? 0}/{r.totalPricingDays} days
            </Text>
          </Space>
        ) : <span style={{ color: '#9ca3af', fontSize: 11 }}>—</span>;
      },
    },
    {
      title: 'Running Avg', width: 110,
      render: (_: unknown, r: BalmoPosition) => (
        r.runningAvgPrice != null
          ? <Text style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.currencyCode} {r.runningAvgPrice.toFixed(4)}</Text>
          : <Text type="secondary" style={{ fontSize: 11 }}>Pending</Text>
      ),
    },
    {
      title: 'Final Price', width: 110,
      render: (_: unknown, r: BalmoPosition) => (
        r.finalSettledPrice != null
          ? <Text style={{ fontFamily: 'monospace', color: '#52c41a', fontWeight: 600 }}>{r.currencyCode} {r.finalSettledPrice.toFixed(4)}</Text>
          : <Text type="secondary" style={{ fontSize: 11 }}>—</Text>
      ),
    },
    {
      title: 'Status', dataIndex: 'balmoStatus', width: 130,
      render: (v: string) => <Badge status={STATUS_COLOR[v] as 'processing' | 'warning' | 'success'} text={<Text style={{ fontSize: 11 }}>{v.replace(/_/g, ' ')}</Text>} />,
    },
    {
      title: '', width: 55,
      render: (_: unknown, r: BalmoPosition) => (
        r.balmoStatus === 'ACTIVE' ? (
          <Tooltip title="Refresh running average from settlement prices">
            <Button
              type="text" size="small" icon={<SyncOutlined spin={updatingId === r.orderId} />}
              onClick={() => { void refreshAvg(r.orderId); }}
            />
          </Tooltip>
        ) : null
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="BALMO Dashboard"
        description="Balance of Month active positions — running average prices, pricing progress, and settlement tracking. Each BALMO prices from the booking date to the last business day of the contract month using daily futures settlements."
        moduleGroup="pricing"
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Active Positions" value={active.length} prefix={<LineChartOutlined style={{ color: '#1677ff' }} />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Buy Volume" value={totalBuy.toLocaleString()} suffix="BBL/eq" valueStyle={{ color: '#52c41a', fontSize: 18 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Total Sell Volume" value={totalSell.toLocaleString()} suffix="BBL/eq" valueStyle={{ color: '#ef4444', fontSize: 18 }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic title="Completed This Month" value={completed.length} />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title={<Space><LineChartOutlined style={{ color: '#1677ff' }} /><span>Active BALMO Positions</span><Tag color="processing">{active.length}</Tag></Space>}
        extra={<Button size="small" icon={<SyncOutlined />} onClick={() => { void refetch(); }} loading={isLoading}>Refresh</Button>}
        style={{ marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={active}
          rowKey="orderId"
          size="small"
          loading={isLoading}
          pagination={false}
          scroll={{ x: 1400 }}
          locale={{ emptyText: 'No active BALMO positions — book a BALMO-priced trade in the Trade Blotter' }}
        />
      </Card>

      {completed.length > 0 && (
        <Card
          size="small"
          title={<Space><span>Completed / Settled Positions</span><Tag>{completed.length}</Tag></Space>}
        >
          <Table
            columns={columns}
            dataSource={completed}
            rowKey="orderId"
            size="small"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 1400 }}
          />
        </Card>
      )}
    </>
  );
}
