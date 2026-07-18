import { useMemo, useState } from 'react';
import { Tag, Space, Typography, Tooltip, Button } from 'antd';
import { InfoCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { COMMODITY_TYPES, type CommodityType } from '@features/reference/commodity-types/types';
import { usePositions } from './hooks';
import type { Position, ConversionSource } from './types';

const { Text } = Typography;

const COMMODITY_COLOR: Record<CommodityType, string> = {
  OIL: 'volcano', GAS: 'blue', POWER: 'gold', METALS: 'purple', AGRICULTURAL: 'green',
  LNG: 'cyan', FREIGHT: 'orange', RINS: 'lime', ENVIRONMENTAL: 'geekblue', MULTI: 'magenta', OTHER: 'default',
};

const CONVERSION_LABEL: Record<ConversionSource, string> = {
  SAME_UOM:          'Same UoM',
  DENSITY_ESTIMATE:  'Density',
  GCV_GROSS:         'GCV',
  ENERGY_CONVERSION: 'Energy ratio',
  MANUAL:            'Manual',
};

const CONVERSION_TOOLTIP: Record<ConversionSource, string> = {
  SAME_UOM:          'Traded UoM is already the base UoM — no conversion needed.',
  DENSITY_ESTIMATE:  'Converted using the product\'s density (set on Pricing Basis tab). The effective rate (e.g. 1 BBL = 0.136 MT) is unique per crude grade.',
  GCV_GROSS:         'Converted using the product\'s gross calorific value (GCV, set on Pricing Basis tab). The effective rate (e.g. 1 SCM = 0.010694 MWh) varies per gas stream.',
  ENERGY_CONVERSION: 'Converted using a fixed energy unit ratio (e.g. 1 THERM = 0.0293071 MWh). From global UoM Conversions — no product property needed.',
  MANUAL:            'Override value entered manually by operations.',
};

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function PositionPage() {
  const [activeCommodity, setActiveCommodity] = useState<CommodityType | 'ALL'>('ALL');
  const { data = [], isLoading, refetch } = usePositions(
    activeCommodity !== 'ALL' ? { commodityType: activeCommodity } : undefined,
  );

  const colDefs = useMemo<ColDef<Position>[]>(() => [
    {
      headerName: 'Book', field: 'bookCode', width: 150,
      cellRenderer: (p: { data: Position }) => (
        <Space direction="vertical" size={0} style={{ lineHeight: 1.3, padding: '4px 0' }}>
          <Text style={{ fontSize: 12, fontWeight: 600 }}>{p.data.bookCode}</Text>
          <Text type="secondary" style={{ fontSize: 10 }}>{p.data.bookName}</Text>
        </Space>
      ),
    },
    {
      headerName: 'Commodity', field: 'commodityType', width: 120,
      cellRenderer: (p: { data: Position }) => (
        <Tag color={COMMODITY_COLOR[p.data.commodityType]} style={{ fontSize: 11 }}>
          {p.data.commodityType}
        </Tag>
      ),
    },
    {
      headerName: 'Product', field: 'productCode', width: 160,
      cellRenderer: (p: { data: Position }) => (
        <Space direction="vertical" size={0} style={{ lineHeight: 1.3, padding: '4px 0' }}>
          <code style={{ fontSize: 12 }}>{p.data.productCode}</code>
          <Text type="secondary" style={{ fontSize: 10 }}>{p.data.productName}</Text>
        </Space>
      ),
    },
    {
      headerName: 'Period', field: 'periodCode', width: 110,
      cellRenderer: (p: { data: Position }) => (
        <code style={{ fontSize: 12 }}>{p.data.periodCode}</code>
      ),
    },
    {
      headerName: 'Net Qty (Traded UoM)', width: 180, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => {
        const isShort = p.data.netQuantity < 0;
        return (
          <Space size={6}>
            <Tag color={isShort ? 'red' : 'green'} style={{ fontSize: 10, margin: 0 }}>
              {isShort ? 'SHORT' : 'LONG'}
            </Tag>
            <code style={{ color: isShort ? '#dc2626' : '#16a34a', fontSize: 12 }}>
              {fmt(Math.abs(p.data.netQuantity))}
            </code>
            <Text type="secondary" style={{ fontSize: 11 }}>{p.data.quantityUomCode}</Text>
          </Space>
        );
      },
    },
    {
      headerName: 'Net Qty (Base UoM)', width: 200, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => {
        if (p.data.netQuantityBase == null || p.data.baseUomCode == null) {
          return <Text type="secondary" style={{ fontSize: 11 }}>—</Text>;
        }
        const isShort = p.data.netQuantityBase < 0;
        const src = p.data.conversionSource;
        return (
          <Space size={6}>
            <code style={{ color: isShort ? '#dc2626' : '#16a34a', fontSize: 12 }}>
              {fmt(Math.abs(p.data.netQuantityBase), 1)}
            </code>
            <Text type="secondary" style={{ fontSize: 11 }}>{p.data.baseUomCode}</Text>
            {src && src !== 'SAME_UOM' && (
              <Tooltip title={CONVERSION_TOOLTIP[src]}>
                <Tag color="default" style={{ fontSize: 10, cursor: 'help', margin: 0 }}>
                  {CONVERSION_LABEL[src]} <InfoCircleOutlined />
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      headerName: 'Avg Price', width: 130, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) =>
        p.data.avgPrice != null ? (
          <Space size={4}>
            <code style={{ fontSize: 12 }}>{fmt(p.data.avgPrice, 2)}</code>
            <Text type="secondary" style={{ fontSize: 11 }}>{p.data.currencyCode}</Text>
          </Space>
        ) : <Text type="secondary">—</Text>,
    },
    {
      headerName: 'Buys', field: 'grossBuyQuantity', width: 110, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => (
        <Space size={4}>
          <Text style={{ color: '#16a34a', fontSize: 12 }}>{fmt(p.data.grossBuyQuantity)}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{p.data.quantityUomCode}</Text>
        </Space>
      ),
    },
    {
      headerName: 'Sells', field: 'grossSellQuantity', width: 110, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => (
        <Space size={4}>
          <Text style={{ color: '#dc2626', fontSize: 12 }}>{fmt(p.data.grossSellQuantity)}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>{p.data.quantityUomCode}</Text>
        </Space>
      ),
    },
    {
      headerName: 'Trades', field: 'tradeCount', width: 80, type: 'numericColumn',
    },
  ], []);

  const commodityBar = (
    <Space size={4} wrap style={{ padding: '0 16px 8px' }}>
      {(['ALL', ...COMMODITY_TYPES] as const).map((c) => (
        <Button
          key={c}
          size="small"
          type={activeCommodity === c ? 'primary' : 'default'}
          onClick={() => setActiveCommodity(c)}
        >
          {c === 'ALL' ? 'All' : c}
        </Button>
      ))}
    </Space>
  );

  return (
    <>
      <PageHeader
        title="Position & P&L"
        description="Net positions aggregated from confirmed trades, per book / product / period. Base UoM: OIL → MT (using product density), GAS volume → MWh (using product GCV), energy units → MWh (fixed ratio from global UoM Conversions)."
        moduleGroup="trade"
        extra={
          <Button icon={<ReloadOutlined />} onClick={() => { void refetch(); }}>
            Recalculate
          </Button>
        }
      />
      {commodityBar}
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        getRowId={(p) => String(p.data.positionId)}
      />
    </>
  );
}
