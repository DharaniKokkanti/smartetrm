import { useMemo } from 'react';
import { Tag, Space, Col, Row, Statistic, Card } from 'antd';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { useRinInventory } from './hooks';
import type { RinInventoryItem } from './types';

const D_CODE_COLOR: Record<string, string> = { D3: 'purple', D4: 'blue', D5: 'green', D6: 'orange', D7: 'cyan' };

export function RinInventoryPage() {
  const { data = [], isLoading, refetch } = useRinInventory();

  // Summary by D-code across all vintages and accounts
  const byDCode = useMemo(() => {
    const map: Record<string, { qty: number; value: number; fuelName: string }> = {};
    data.forEach((row) => {
      if (!map[row.dCode]) map[row.dCode] = { qty: 0, value: 0, fuelName: row.fuelName };
      map[row.dCode].qty += row.quantity;
      map[row.dCode].value += row.totalValue ?? 0;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  const totalRins  = data.reduce((s, r) => s + r.quantity, 0);
  const totalValue = data.reduce((s, r) => s + (r.totalValue ?? 0), 0);

  const colDefs = useMemo<ColDef<RinInventoryItem>[]>(() => [
    { field: 'dCode', headerName: 'D-Code', width: 90, pinned: 'left',
      cellRenderer: (p: { value: string }) => <Tag color={D_CODE_COLOR[p.value] ?? 'default'} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}>{p.value}</Tag> },
    { field: 'fuelName',    headerName: 'Fuel Type',     flex: 1,   minWidth: 180 },
    { field: 'vintageYear', headerName: 'Vintage',       width: 90,  cellClass: 'cell-mono', type: 'numericColumn' },
    { field: 'accountName', headerName: 'RIN Account',   flex: 1,   minWidth: 180 },
    { field: 'quantity',    headerName: 'RINs Held',     width: 140, type: 'numericColumn',
      cellRenderer: (p: { value: number }) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1677ff' }}>{p.value.toLocaleString()}</span>
      ) },
    { field: 'avgCostPerRin', headerName: 'Avg Cost/RIN', width: 130, type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? `$${Number(p.value).toFixed(4)}` : '—' },
    { field: 'totalValue', headerName: 'Total Value', width: 130, type: 'numericColumn',
      valueFormatter: (p) => p.value != null ? `$${Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—' },
    { field: 'asOfDate', headerName: 'As of Date', width: 110, cellClass: 'cell-mono' },
  ], []);

  return (
    <>
      <PageHeader
        title="RIN Inventory"
        description="Current RIN holdings by D-code, vintage year, and account. Position is derived from all CONFIRMED transactions (generates + buys − sells − retires). Prior-year vintages are valid for compliance up to 20% of the annual RVO."
        moduleGroup="rins"
        extra={
          <Space>
            <Tag color="blue">Total: {totalRins.toLocaleString()} RINs</Tag>
            <Tag color="green">Value: ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</Tag>
          </Space>
        }
      />
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        {byDCode.map(([dCode, { qty, value, fuelName }]) => (
          <Col key={dCode} xs={12} sm={8} md={6} lg={4}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Tag color={D_CODE_COLOR[dCode] ?? 'default'} style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{dCode}</Tag>
              <Statistic value={qty} formatter={(v) => Number(v).toLocaleString()} valueStyle={{ fontSize: 18, fontWeight: 700, color: '#1677ff' }} />
              <div style={{ fontSize: 10, color: '#6b7280' }}>{fuelName}</div>
              {value > 0 && <div style={{ fontSize: 11, color: '#16a34a', marginTop: 2 }}>${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>}
            </Card>
          </Col>
        ))}
      </Row>
      <SmartGrid
        columnDefs={colDefs} rowData={data} loading={isLoading}
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.inventoryId)}
      />
    </>
  );
}
