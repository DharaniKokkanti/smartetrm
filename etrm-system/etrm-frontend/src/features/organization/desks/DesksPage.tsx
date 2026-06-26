import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { useDesks, useDeactivateDesk } from './hooks';
import type { Desk } from './types';
import { DeskFormDrawer } from './DeskFormDrawer';

export function DesksPage() {
  const { data, isLoading, refetch } = useDesks();
  const deactivate = useDeactivateDesk();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Desk | null>(null);

  const colDefs = useMemo<ColDef<Desk>[]>(() => [
    { field: 'deskCode', headerName: 'Code', cellClass: 'cell-mono', width: 140, pinned: 'left' },
    { field: 'deskName', headerName: 'Desk Name', flex: 1.4, minWidth: 180 },
    { field: 'legalEntityCode', headerName: 'Legal Entity', width: 140, cellClass: 'cell-mono' },
    {
      field: 'commodityType',
      headerName: 'Commodity',
      width: 130,
      cellRenderer: (p: { value: string | null }) =>
        p.value ? <Tag>{p.value}</Tag> : <Tag color="default">MULTI</Tag>,
    },
    { field: 'headTraderName', headerName: 'Head Trader', width: 160, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '',
      width: 90,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: (p: { data: Desk }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data); setDrawerOpen(true); }} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate desk?" onConfirm={() => deactivate.mutate(p.data.deskId)}
              okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate]);

  return (
    <>
      <PageHeader
        title="Trading Desks"
        description="Internal trading desks — each linked to a legal entity and optional commodity specialization."
        moduleGroup="organization"
        extra={null}
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={() => { setEditing(null); setDrawerOpen(true); }}
        addLabel="New Desk"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.deskId)}
      />
      <DeskFormDrawer open={drawerOpen} editing={editing} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
