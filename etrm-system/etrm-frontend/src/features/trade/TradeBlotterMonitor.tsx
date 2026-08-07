import { useMemo, useState } from 'react';
import { Tag, Space, Typography, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { useTrades } from './hooks';
import type { Trade, SourceSystemCode } from './types';
import { SOURCE_SYSTEM_CODES } from './types';

const { Text } = Typography;

const COMMODITY_COLOR: Record<string, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', LNG: 'cyan',
  AGRICULTURAL: 'green', METALS: 'purple', FREIGHT: 'orange',
  RINS: 'lime', ENVIRONMENTAL: 'geekblue',
};
const DIRECTION_COLOR: Record<string, string> = { BUY: 'green', SELL: 'red' };
const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'default', CONFIRMED: 'success', AMENDED: 'warning',
  CANCELLED: 'error', MATURED: 'blue', CLOSED: 'default',
};

// Trade Capture entry reads as neutral; everything else is a non-interactive
// channel and gets a distinct color so it's easy to scan a mixed blotter at
// a glance. Keyed by source_system.source_code (V192/V193), not a hardcoded
// enum — extend this map when a new source_system row is registered.
const SOURCE_COLOR: Record<SourceSystemCode, string> = {
  TRADE_CAPTURE_SCREEN: 'default',
  BULK_EXCEL_UPLOAD: 'gold',
  EXTERNAL_API_GENERIC: 'cyan',
  EXCHANGE_FEED_ICE: 'purple',
  EXCHANGE_FEED_NYMEX: 'geekblue',
  SYSTEM_MIGRATION: 'default',
};
const SOURCE_LABEL: Record<SourceSystemCode, string> = {
  TRADE_CAPTURE_SCREEN: 'Trade Capture',
  BULK_EXCEL_UPLOAD: 'Excel Upload',
  EXTERNAL_API_GENERIC: 'External API',
  EXCHANGE_FEED_ICE: 'ICE Feed',
  EXCHANGE_FEED_NYMEX: 'NYMEX Feed',
  SYSTEM_MIGRATION: 'System',
};

export function TradeBlotterMonitor() {
  const [activeSource, setActiveSource] = useState<SourceSystemCode | 'ALL'>('ALL');
  const { data: trades = [], isLoading, refetch } = useTrades();

  // Filters on the origin (created) source — "show me everything that came
  // in via Excel", not "everything last touched via Excel".
  const filteredTrades = useMemo(
    () => (activeSource === 'ALL' ? trades : trades.filter((t) => t.createdSourceSystemCode === activeSource)),
    [trades, activeSource],
  );

  const colDefs = useMemo<ColDef<Trade>[]>(() => [
    { field: 'tradeReference', headerName: 'Reference', width: 170, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'tradeDate', headerName: 'Date', width: 100, cellClass: 'cell-mono' },
    {
      field: 'createdSourceSystemCode', headerName: 'Source', width: 150,
      cellRenderer: (p: { value: SourceSystemCode }) => (
        <Tag color={SOURCE_COLOR[p.value]} style={{ fontSize: 10 }}>{SOURCE_LABEL[p.value]}</Tag>
      ),
    },
    {
      // Only rendered when the row was last touched through a different
      // channel than it was created through — e.g. an Excel-uploaded trade
      // later edited via Trade Capture. Blank otherwise, to avoid clutter on
      // the common case where nothing has diverged from creation.
      field: 'updatedSourceSystemCode', headerName: 'Last Updated Via', width: 150,
      cellRenderer: (p: { value: SourceSystemCode; data: Trade }) =>
        p.data.updatedSourceSystemCode === p.data.createdSourceSystemCode
          ? null
          : <Tag color={SOURCE_COLOR[p.value]} style={{ fontSize: 10 }}>{SOURCE_LABEL[p.value]}</Tag>,
    },
    { field: 'counterpartyName', headerName: 'Counterparty', flex: 1, minWidth: 160 },
    { field: 'traderCode', headerName: 'Trader', width: 72, cellClass: 'cell-mono' },
    {
      field: 'commodityType', headerName: 'Commodity', width: 105,
      cellRenderer: (p: { value: string }) => <Tag color={COMMODITY_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      field: 'direction', headerName: 'B/S', width: 58,
      cellRenderer: (p: { value: string }) => <Tag color={DIRECTION_COLOR[p.value]} style={{ fontWeight: 700 }}>{p.value}</Tag>,
    },
    { field: 'contractNumber', headerName: 'Contract #', width: 140, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'orderCount', headerName: 'Legs', width: 58,
      cellRenderer: (p: { value: number }) => (
        <Tag color={p.value > 1 ? 'geekblue' : 'default'} style={{ fontSize: 10 }}>{p.value}</Tag>
      ),
    },
    {
      field: 'status', headerName: 'Status', width: 100,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value]}>{p.value}</Tag>,
    },
  ], []);

  const sourceBar = (
    <Space size={4} wrap style={{ padding: '0 16px 8px' }}>
      {(['ALL', ...SOURCE_SYSTEM_CODES] as const).map((s) => (
        <Button
          key={s}
          size="small"
          type={activeSource === s ? 'primary' : 'default'}
          onClick={() => setActiveSource(s)}
        >
          {s === 'ALL' ? 'All Sources' : SOURCE_LABEL[s]}
        </Button>
      ))}
    </Space>
  );

  return (
    <>
      <PageHeader
        title="Trade Blotter"
        description="Read-only monitoring view across every trade regardless of how it was captured — manual entry, Excel upload, external API, or exchange feed. For entering or amending a trade, use Trade Capture."
        moduleGroup="trade"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => { void refetch(); }}>
            Refresh
          </Button>
        }
      />
      {sourceBar}
      <SmartGrid
        columnDefs={colDefs}
        rowData={filteredTrades}
        loading={isLoading}
        getRowId={(t) => String(t.data.tradeId)}
      />
      {filteredTrades.length === 0 && !isLoading && (
        <Text type="secondary" style={{ padding: '8px 16px', display: 'block' }}>
          No trades from this source yet.
        </Text>
      )}
    </>
  );
}
