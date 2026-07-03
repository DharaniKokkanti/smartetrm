import { useMemo, useState } from 'react';
import { Button, Space, Popconfirm, Tag } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { useBooks, useDeactivateBook } from './hooks';
import type { Book, BookType } from './types';
import { BookFormDrawer } from './BookFormDrawer';
import { useDraftState } from '@components/smart/formDraft';

const BOOK_TYPE_COLOR: Record<BookType, string> = {
  TRADING: 'blue',
  HEDGING: 'cyan',
  ARBITRAGE: 'purple',
  PROP: 'magenta',
  CLIENT: 'orange',
  RISK_MGMT: 'gold',
};

export function BooksPage() {
  const { data, isLoading, refetch } = useBooks();
  const deactivate = useDeactivateBook();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  useDraftState('org-books', { open: drawerOpen, setOpen: setDrawerOpen, editing, setEditing });

  const colDefs = useMemo<ColDef<Book>[]>(() => [
    { field: 'bookCode', headerName: 'Code', cellClass: 'cell-mono', width: 160, pinned: 'left' },
    { field: 'bookName', headerName: 'Book Name', flex: 1.4, minWidth: 180 },
    {
      field: 'bookType',
      headerName: 'Type',
      width: 130,
      cellRenderer: (p: { value: BookType }) => <Tag color={BOOK_TYPE_COLOR[p.value]}>{p.value}</Tag>,
    },
    { field: 'deskCode', headerName: 'Desk', width: 130, cellClass: 'cell-mono' },
    { field: 'legalEntityCode', headerName: 'Entity', width: 110, cellClass: 'cell-mono' },
    { field: 'commodityType', headerName: 'Commodity', width: 120,
      cellRenderer: (p: { value: string | null }) => p.value ? <Tag>{p.value}</Tag> : <Tag color="default">MULTI</Tag> },
    { field: 'responsibleTraderName', headerName: 'Trader', width: 150, valueFormatter: (p) => p.value ?? '—' },
    {
      field: 'positionLimit',
      headerName: 'Pos. Limit',
      width: 130,
      cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? Number(p.value).toLocaleString() : '—',
    },
    {
      field: 'pnlLimit',
      headerName: 'P&L Limit',
      width: 130,
      cellClass: 'cell-mono',
      valueFormatter: (p) => p.value != null ? `$${Number(p.value).toLocaleString()}` : '—',
    },
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
      cellRenderer: (p: { data: Book }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data); setDrawerOpen(true); }} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate book?" onConfirm={() => deactivate.mutate(p.data.bookId)}
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
        title="P&L Books"
        description="Trading books — each book is a P&L segregation unit linked to a desk and legal entity."
        moduleGroup="organization"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={() => { setEditing(null); setDrawerOpen(true); }}
        addLabel="New Book"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.bookId)}
      />
      <BookFormDrawer open={drawerOpen} editing={editing} onClose={() => setDrawerOpen(false)} onSaved={(b) => setEditing(b)} />
    </>
  );
}
