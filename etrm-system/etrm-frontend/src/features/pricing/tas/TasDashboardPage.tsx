import { useMemo } from 'react';
import { Button, Tag, Card, Statistic, Row, Col, Tooltip, Popconfirm } from 'antd';
import { LockOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { App as AntApp } from 'antd';
import type { ColDef, CellStyle } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { apiClient, type ProblemDetail } from '@services/api';

interface TasPosition {
  orderId: number;
  tradeId: number;
  tradeReference: string | null;
  orderReference: string;
  counterpartyName: string | null;
  direction: string | null;
  productCode: string | null;
  quantity: number;
  uomCode: string;
  currencyCode: string;
  price: number | null;
  pricingRuleId: number | null;
  ruleCode: string | null;
  tasExchange: string | null;
  tasContractSeries: string | null;
  tasTickSize: number | null;
  riskStartDate: string;
  riskEndDate: string;
  tasDetail: {
    tasContractTicker: string;
    tasDifferential: number;
    tasStatus: 'AWAITING_SETTLEMENT' | 'PRICE_LOCKED';
    tasLockedPrice: number | null;
    tasSettlementDate: string | null;
  } | null;
}

const KEY_TAS = ['tas-positions'] as const;

function useTasPositions() {
  return useQuery({
    queryKey: KEY_TAS,
    queryFn: () => apiClient.get<TasPosition[]>('/pricing/tas-positions').then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

function useLockTasPrice() {
  const qc = useQueryClient();
  const { message } = AntApp.useApp();
  return useMutation({
    mutationFn: (orderId: number) =>
      apiClient.patch<TasPosition>(`/pricing/tas-positions/${orderId}/lock-price`).then((r) => r.data),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: KEY_TAS });
      qc.invalidateQueries({ queryKey: ['trade-orders'] });
      const locked = d.tasDetail?.tasLockedPrice;
      const ticker = d.tasDetail?.tasContractTicker ?? '';
      message.success(`${ticker} price locked at ${d.currencyCode} ${locked?.toFixed(4) ?? '—'}`);
    },
    onError: (e: ProblemDetail) => message.error(e.detail ?? e.title ?? 'Lock failed.'),
  });
}

const STATUS_COLOR: Record<string, string> = { AWAITING_SETTLEMENT: 'warning', PRICE_LOCKED: 'success' };
const DIRECTION_COLOR: Record<string, string> = { BUY: 'green', SELL: 'red' };

export function TasDashboardPage() {
  const { data = [], isLoading, refetch } = useTasPositions();
  const lock = useLockTasPrice();

  const awaiting = useMemo(() => data.filter((p) => p.tasDetail?.tasStatus === 'AWAITING_SETTLEMENT').length, [data]);
  const locked = useMemo(() => data.filter((p) => p.tasDetail?.tasStatus === 'PRICE_LOCKED').length, [data]);

  const colDefs = useMemo<ColDef<TasPosition>[]>(() => [
    { field: 'tradeReference', headerName: 'Trade', width: 155, cellClass: 'cell-mono', pinned: 'left', valueFormatter: (p) => p.value ?? '—' },
    { field: 'orderReference', headerName: 'Leg Ref', width: 180, cellClass: 'cell-mono' },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'direction', headerName: 'B/S', width: 58,
      cellRenderer: (p: { value: string | null }) =>
        p.value ? <Tag color={DIRECTION_COLOR[p.value]} style={{ fontWeight: 700, fontSize: 10 }}>{p.value}</Tag> : <span style={{ color: '#9ca3af' }}>—</span>,
    },
    {
      headerName: 'Contract', width: 90, cellClass: 'cell-mono',
      valueGetter: (p) => p.data?.tasDetail?.tasContractTicker ?? '—',
    },
    {
      headerName: 'Diff (ticks)', width: 100, cellClass: 'cell-mono',
      valueGetter: (p) => {
        const d = p.data?.tasDetail?.tasDifferential;
        if (d == null) return '—';
        return d > 0 ? `+${d}` : `${d}`;
      },
      cellStyle: (p) => {
        const d = (p.data as TasPosition)?.tasDetail?.tasDifferential;
        return d != null && d !== 0 ? { fontWeight: 600, color: d > 0 ? '#22c55e' : '#ef4444' } : null;
      },
    },
    {
      headerName: 'Qty / UoM', width: 120,
      valueGetter: (p) => p.data ? `${Number(p.data.quantity).toLocaleString()} ${p.data.uomCode}` : '—',
      cellStyle: { fontFamily: 'monospace', fontSize: 11 } as CellStyle,
    },
    {
      headerName: 'Risk Period', width: 180,
      valueGetter: (p) => p.data ? `${p.data.riskStartDate} → ${p.data.riskEndDate}` : '—',
      cellStyle: { fontSize: 11, fontFamily: 'monospace' } as CellStyle,
    },
    {
      headerName: 'TAS Status', width: 145,
      valueGetter: (p) => p.data?.tasDetail?.tasStatus ?? '—',
      cellRenderer: (p: { value: string }) => (
        p.value === '—'
          ? <span style={{ color: '#9ca3af' }}>—</span>
          : <Tag color={STATUS_COLOR[p.value] ?? 'default'} icon={p.value === 'AWAITING_SETTLEMENT' ? <ClockCircleOutlined /> : <CheckCircleOutlined />} style={{ fontSize: 10 }}>
              {p.value.replace(/_/g, ' ')}
            </Tag>
      ),
    },
    {
      headerName: 'Locked Price', width: 120, cellClass: 'cell-mono',
      valueGetter: (p) => {
        const lp = p.data?.tasDetail?.tasLockedPrice;
        return lp != null ? `${p.data?.currencyCode ?? ''} ${Number(lp).toFixed(4)}` : null;
      },
      valueFormatter: (p) => p.value ?? '—',
      cellStyle: { color: '#22c55e', fontWeight: 600 } as CellStyle,
    },
    {
      field: 'tasDetail', headerName: 'Settle Date', width: 110,
      valueGetter: (p) => p.data?.tasDetail?.tasSettlementDate ?? null,
      valueFormatter: (p) => p.value ?? '—',
      cellStyle: { fontFamily: 'monospace', fontSize: 11 } as CellStyle,
    },
    {
      headerName: '', width: 115, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: TasPosition }) => {
        const isAwaiting = p.data.tasDetail?.tasStatus === 'AWAITING_SETTLEMENT';
        return isAwaiting ? (
          <Popconfirm
            title="Lock TAS price?"
            description={`Apply today's settlement for ${p.data.tasDetail?.tasContractTicker ?? ''}`}
            onConfirm={() => lock.mutate(p.data.orderId)}
            okText="Lock Price"
            okButtonProps={{ icon: <LockOutlined /> }}
          >
            <Tooltip title="Lock settlement price for this TAS leg">
              <Button type="primary" size="small" icon={<LockOutlined />} loading={lock.isPending}>
                Lock Price
              </Button>
            </Tooltip>
          </Popconfirm>
        ) : (
          <Tag color="success" style={{ fontSize: 10, margin: 0 }}>LOCKED</Tag>
        );
      },
    },
  ], [lock]);

  return (
    <>
      <PageHeader
        title="TAS Dashboard"
        description="Trade at Settlement positions — futures legs priced at the exchange daily settlement ± differential (ticks). Lock price when settlement is confirmed."
        moduleGroup="pricing"
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Total TAS Positions" value={data.length} valueStyle={{ color: '#1677ff' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Awaiting Settlement" value={awaiting} valueStyle={{ color: awaiting > 0 ? '#f59e0b' : '#6b7280' }} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic title="Price Locked" value={locked} valueStyle={{ color: locked > 0 ? '#22c55e' : '#6b7280' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.orderId)}
        getRowStyle={(p) => {
          const status = (p.data as TasPosition).tasDetail?.tasStatus;
          if (status === 'PRICE_LOCKED') return { background: 'rgba(34,197,94,0.04)' };
          if (status === 'AWAITING_SETTLEMENT') return { background: 'rgba(245,158,11,0.04)' };
          return undefined;
        }}
      />
    </>
  );
}
