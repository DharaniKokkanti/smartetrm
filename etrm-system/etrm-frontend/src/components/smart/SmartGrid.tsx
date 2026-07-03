import React, { useMemo, useRef, useState, type ReactNode } from 'react';
import { Button, Input, Segmented, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, GetRowIdParams, GridApi, RowClickedEvent, RowStyle, RowClassParams } from 'ag-grid-community';
import { buildAgGridTheme } from '@theme/ag-grid-theme';
import { useThemeStore } from '@store/themeStore';

const COMMODITY_TYPES = ['ALL', 'OIL', 'GAS', 'POWER', 'LNG', 'METALS', 'AGRICULTURAL', 'FREIGHT', 'RINS', 'ENVIRONMENTAL', 'MULTI', 'OTHER'] as const;
type CommodityFilter = (typeof COMMODITY_TYPES)[number];

interface SmartGridProps<T> {
  columnDefs: ColDef<T>[];
  rowData: T[] | undefined;
  loading: boolean;
  onAdd?: () => void;
  addLabel?: string;
  extraToolbar?: ReactNode;
  commodityFilter?: boolean;
  activeCommodity?: CommodityFilter;
  onCommodityChange?: (c: CommodityFilter) => void;
  height?: number | string;
  style?: React.CSSProperties;
  getRowId?: (params: GetRowIdParams<T>) => string;
  onRefresh?: () => void;
  onRowClicked?: (event: RowClickedEvent<T>) => void;
  getRowStyle?: (params: RowClassParams<T>) => RowStyle | undefined;
}

export function SmartGrid<T>({
  columnDefs,
  rowData,
  loading,
  onAdd,
  addLabel = 'New',
  extraToolbar,
  commodityFilter = false,
  activeCommodity = 'ALL',
  onCommodityChange,
  height = 'calc(100vh - 240px)',
  style,
  getRowId,
  onRefresh,
  onRowClicked,
  getRowStyle,
}: SmartGridProps<T>) {
  const mode = useThemeStore((s) => s.mode);
  const gridTheme = useMemo(() => buildAgGridTheme(mode), [mode]);
  const [quickFilter, setQuickFilter] = useState('');
  const gridRef = useRef<GridApi<T> | null>(null);

  function exportCsv() {
    gridRef.current?.exportDataAsCsv();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      {/* Toolbar row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Input
          prefix={<SearchOutlined style={{ opacity: 0.45 }} />}
          placeholder="Quick search…"
          value={quickFilter}
          onChange={(e) => setQuickFilter(e.target.value)}
          allowClear
          style={{ width: 220 }}
          size="small"
        />
        {commodityFilter && (
          <Segmented
            size="small"
            options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))}
            value={activeCommodity}
            onChange={(v) => onCommodityChange?.(v as CommodityFilter)}
          />
        )}
        {extraToolbar}
        <div style={{ flex: 1 }} />
        {onRefresh && (
          <Tooltip title="Refresh">
            <Button size="small" icon={<ReloadOutlined />} onClick={onRefresh} />
          </Tooltip>
        )}
        <Tooltip title="Export CSV">
          <Button size="small" icon={<DownloadOutlined />} onClick={exportCsv} />
        </Tooltip>
        {onAdd && (
          <Button type="primary" size="small" icon={<PlusOutlined />} onClick={onAdd}>
            {addLabel}
          </Button>
        )}
      </div>

      {/* Grid */}
      <div style={{ height, minHeight: typeof height === 'number' ? height : 300 }}>
        <AgGridReact<T>
          theme={gridTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          loading={loading}
          quickFilterText={quickFilter}
          pagination
          paginationPageSize={50}
          paginationPageSizeSelector={[25, 50, 100]}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          getRowId={getRowId}
          onGridReady={(e) => {
            gridRef.current = e.api;
          }}
          onRowClicked={onRowClicked}
          getRowStyle={getRowStyle}
          overlayNoRowsTemplate='<span style="opacity:0.45">No records found</span>'
        />
      </div>
    </div>
  );
}
