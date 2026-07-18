import { useMemo, useState } from 'react';
import { Button, Space, Tag, Segmented, Modal, Form, Select, Input } from 'antd';
import { EditOutlined, StopOutlined, SwapOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { useBooks, useArchiveBook, useMoveBook } from './hooks';
import { commodityLabel } from '../desks/types';
import { bookTypeLabel } from './types';
import type { Book, BookTraderView } from './types';
import { BookFormDrawer } from './BookFormDrawer';
import { useDraftState } from '@components/smart/formDraft';
import { useDesks } from '../desks/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';

const BOOK_TYPE_COLOR: Record<number, string> = {
  1: 'blue',   // TRADING
  2: 'cyan',   // HEDGING
  3: 'purple', // ARBITRAGE
  4: 'magenta', // PROP
  5: 'orange', // CLIENT
  6: 'gold',   // RISK_MGMT
};

function tradersDisplay(traders: BookTraderView[]): string {
  const active = traders.filter((t) => t.isActive);
  if (active.length === 0) return '—';
  const primary = active.filter((t) => t.role === 'PRIMARY');
  const rest = active.filter((t) => t.role !== 'PRIMARY');
  return [...primary, ...rest].map((t) => t.traderName).join(', ');
}

/** Walks parentBookId chains — same cycle-avoidance logic as BookFormDrawer's picker. */
function collectDescendants(books: Book[], rootId: number): Set<number> {
  const result = new Set<number>();
  let frontier = [rootId];
  while (frontier.length) {
    const next: number[] = [];
    for (const b of books) {
      if (b.parentBookId != null && frontier.includes(b.parentBookId) && !result.has(b.bookId)) {
        result.add(b.bookId);
        next.push(b.bookId);
      }
    }
    frontier = next;
  }
  return result;
}

// ── Archive-with-reason modal ──────────────────────────────────────────────────
function ArchiveModal({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const archive = useArchiveBook();
  return (
    <Modal mask={false} forceRender
      open={book !== null}
      title={book ? `Archive Book — ${book.bookCode}` : 'Archive Book'}
      onCancel={() => { setReason(''); onClose(); }}
      onOk={() => {
        if (!book) return;
        archive.mutate({ id: book.bookId, reason }, { onSuccess: () => { setReason(''); onClose(); } });
      }}
      okButtonProps={{ danger: true, loading: archive.isPending, disabled: !reason.trim() }}
      okText="Archive"
      destroyOnHidden
    >
      <Form.Item label="Reason" required style={{ marginTop: 16 }}>
        <Input.TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Enter reason for archiving..." />
      </Form.Item>
    </Modal>
  );
}

// ── Move modal ──────────────────────────────────────────────────────────────────
function MoveModal({ book, onClose }: { book: Book | null; onClose: () => void }) {
  const [form] = Form.useForm<{ legalEntityId: number; deskId: number | null; parentBookId: number | null }>();
  const { data: legalEntities = [] } = useLegalEntities();
  const { data: desks = [] } = useDesks();
  const { data: allBooks = [] } = useBooks();
  const move = useMoveBook();

  const legalEntityId = Form.useWatch('legalEntityId', form);

  const deskOptions = desks
    .filter((d) => legalEntityId == null || d.legalEntityId === legalEntityId)
    .map((d) => ({ label: `${d.deskCode} — ${d.deskName}`, value: d.deskId }));

  const parentBookOptions = useMemo(() => {
    if (!book) return [];
    const descendants = collectDescendants(allBooks, book.bookId);
    return allBooks
      .filter((b) => b.bookId !== book.bookId && !descendants.has(b.bookId))
      .filter((b) => legalEntityId == null || b.legalEntityId === legalEntityId)
      .map((b) => ({ label: `${b.bookCode} — ${b.bookName}`, value: b.bookId }));
  }, [allBooks, book, legalEntityId]);

  return (
    <Modal mask={false} forceRender
      open={book !== null}
      title={book ? `Move Book — ${book.bookCode}` : 'Move Book'}
      onCancel={onClose}
      okText="Move"
      okButtonProps={{ loading: move.isPending }}
      onOk={async () => {
        if (!book) return;
        const vals = await form.validateFields();
        move.mutate({ id: book.bookId, body: vals }, { onSuccess: () => onClose() });
      }}
      destroyOnHidden
      afterOpenChange={(open) => {
        if (open && book) {
          form.setFieldsValue({ legalEntityId: book.legalEntityId, deskId: book.deskId, parentBookId: book.parentBookId });
        }
      }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" placeholder="Select legal entity"
            options={legalEntities.map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }))} />
        </Form.Item>
        <Form.Item name="deskId" label="Desk" rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="label" placeholder="Select desk" options={deskOptions} />
        </Form.Item>
        <Form.Item name="parentBookId" label="Parent Book">
          <Select allowClear showSearch optionFilterProp="label" placeholder="None (top-level book)" options={parentBookOptions} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export function BooksPage() {
  const { data, isLoading, refetch } = useBooks();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [statusFilter, setStatusFilter] = useState<'Active' | 'Archived'>('Active');
  const [archiveTarget, setArchiveTarget] = useState<Book | null>(null);
  const [moveTarget, setMoveTarget] = useState<Book | null>(null);
  useDraftState('org-books', { open: drawerOpen, setOpen: setDrawerOpen, editing, setEditing });

  const filteredData = useMemo(() => (data ?? []).filter((b) =>
    statusFilter === 'Active' ? b.isActive : !b.isActive), [data, statusFilter]);

  const colDefs = useMemo<ColDef<Book>[]>(() => [
    { field: 'bookCode', headerName: 'Code', cellClass: 'cell-mono', width: 160, pinned: 'left' },
    { field: 'bookName', headerName: 'Book Name', flex: 1.4, minWidth: 180 },
    {
      field: 'bookType',
      headerName: 'Type',
      width: 130,
      cellRenderer: (p: { value: number }) => <Tag color={BOOK_TYPE_COLOR[p.value]}>{bookTypeLabel(p.value)}</Tag>,
    },
    { field: 'deskCode', headerName: 'Desk', width: 130, cellClass: 'cell-mono' },
    { field: 'legalEntityCode', headerName: 'Entity', width: 110, cellClass: 'cell-mono' },
    { field: 'parentBookCode', headerName: 'Parent', width: 130, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    { field: 'commodityType', headerName: 'Commodity', width: 120,
      cellRenderer: (p: { value: number | null }) => p.value != null ? <Tag>{commodityLabel(p.value)}</Tag> : <Tag color="default">MULTI</Tag> },
    {
      field: 'traders',
      headerName: 'Traders',
      flex: 1,
      minWidth: 160,
      valueFormatter: (p) => tradersDisplay(p.value ?? []),
      tooltipValueGetter: (p) => tradersDisplay(p.value ?? []),
    },
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
      width: 130,
      sortable: false,
      filter: false,
      pinned: 'right',
      cellRenderer: (p: { data: Book }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data); setDrawerOpen(true); }} />
          <Button type="text" size="small" icon={<SwapOutlined />}
            onClick={() => setMoveTarget(p.data)} />
          {p.data.isActive && (
            <Button type="text" size="small" danger icon={<StopOutlined />}
              onClick={() => setArchiveTarget(p.data)} />
          )}
        </Space>
      ),
    },
  ], []);

  return (
    <>
      <PageHeader
        title="P&L Books"
        description="Trading books — each book is a P&L segregation unit linked to a desk and legal entity."
        moduleGroup="organization"
      />
      <div style={{ marginBottom: 12 }}>
        <Segmented options={['Active', 'Archived']} value={statusFilter} onChange={(v) => setStatusFilter(v as 'Active' | 'Archived')} />
      </div>
      <SmartGrid
        columnDefs={colDefs}
        rowData={filteredData}
        loading={isLoading}
        onAdd={() => { setEditing(null); setDrawerOpen(true); }}
        addLabel="New Book"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.bookId)}
      />
      <BookFormDrawer open={drawerOpen} editing={editing} onClose={() => setDrawerOpen(false)} onSaved={(b) => setEditing(b)} />
      <ArchiveModal book={archiveTarget} onClose={() => setArchiveTarget(null)} />
      <MoveModal book={moveTarget} onClose={() => setMoveTarget(null)} />
    </>
  );
}
