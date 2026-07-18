import { useEffect, useMemo, useRef, useState, type JSX, type MouseEvent as ReactMouseEvent } from 'react';
import { Input, Empty, Tag, Space, Typography, Button, Segmented, Tooltip } from 'antd';
import {
  SearchOutlined, EditOutlined, PlusOutlined, DoubleLeftOutlined, DoubleRightOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { SmartGrid } from '@components/smart/SmartGrid';
import { useThemeStore } from '@store/themeStore';
import { paletteFor, moduleColor, type ThemeMode } from '@theme/tokens';
import { useBooks, useBookEodStatus, useBookDescendants } from './hooks';
import { bookLevelTypeCode, bookLevelTypeLabel, bookTypeLabel } from './types';
import type { Book } from './types';
import { BookFormDrawer } from './BookFormDrawer';
import { usePositions } from '@features/trade/positions/hooks';
import type { Position } from '@features/trade/positions/types';

type Palette = ReturnType<typeof paletteFor>;

// dbo.legal_entity is deliberately NOT a node here — it's a separate table
// with its own hierarchy (see book_level_type comment in ./types.ts).
// Whether a row is a leaf comes from book.is_leaf_node, not its level code —
// admins can add new book_level_type rows (via Static Data, V124) without
// this map knowing about them; unmapped codes just fall back to the plain
// trading-book icon below rather than being unrenderable.
const LEVEL_ICON: Record<string, string> = {
  DESK: '🖥️',
  STRATEGY: '📈',
  TRADING_BOOK: '📄',
};

interface BookTreeNode extends Book {
  children: BookTreeNode[];
}

function buildTree(books: Book[]): BookTreeNode[] {
  const byId = new Map<number, BookTreeNode>();
  books.forEach((b) => byId.set(b.bookId, { ...b, children: [] }));
  const roots: BookTreeNode[] = [];
  byId.forEach((node) => {
    const parent = node.parentBookId != null ? byId.get(node.parentBookId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const sortByName = (nodes: BookTreeNode[]) => {
    nodes.sort((a, b) => a.bookName.localeCompare(b.bookName));
    nodes.forEach((n) => sortByName(n.children));
  };
  sortByName(roots);
  return roots;
}

/** bookIds whose subtree contains a match — used to auto-expand ancestors and hide non-matching branches while searching. */
function matchIds(nodes: BookTreeNode[], query: string): Set<number> {
  const hits = new Set<number>();
  const q = query.trim().toLowerCase();
  if (!q) return hits;
  function walk(node: BookTreeNode): boolean {
    const self = node.bookName.toLowerCase().includes(q) || node.bookCode.toLowerCase().includes(q);
    const childHit = node.children.map(walk).some(Boolean);
    if (self || childHit) hits.add(node.bookId);
    return self || childHit;
  }
  nodes.forEach(walk);
  return hits;
}

function highlight(text: string, query: string): JSX.Element | string {
  const q = query.trim();
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: '#F5D67B', color: '#1C1C1A', padding: 0 }}>{text.slice(idx, idx + q.length)}</mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function TreeNodeRow({
  node, depth, query, matches, expanded, onToggle, selectedId, onSelect, onEdit, c,
}: {
  node: BookTreeNode;
  depth: number;
  query: string;
  matches: Set<number>;
  expanded: Set<number>;
  onToggle: (id: number) => void;
  selectedId: number | null;
  onSelect: (book: Book) => void;
  onEdit: (book: Book) => void;
  c: Palette;
}) {
  const isSearching = query.trim().length > 0;
  if (isSearching && !matches.has(node.bookId)) return null;

  const isContainer = !node.isLeafNode;
  const isOpen = isSearching ? true : expanded.has(node.bookId);
  const levelCode = bookLevelTypeCode(node.bookLevelTypeId) ?? 'TRADING_BOOK';
  const icon = LEVEL_ICON[levelCode] ?? '📄';
  const isSelected = selectedId === node.bookId;

  // Any row — container or leaf — is selectable (so a group book's rolled-up
  // positions/P&L show up the moment you click it, no separate "view rollup"
  // step). Containers additionally expand/collapse on the same click; the
  // caret is not a separate hit target since one click doing both matches
  // how the rest of this app's collapsible groups behave.
  function handleClick() {
    onSelect(node);
    if (isContainer) onToggle(node.bookId);
  }

  return (
    <div>
      <div
        onClick={handleClick}
        role="treeitem"
        aria-expanded={isContainer ? isOpen : undefined}
        aria-selected={isSelected}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 6px',
          paddingLeft: 6 + depth * 16,
          cursor: 'pointer',
          borderRadius: 4,
          background: isSelected ? `${c.secondary}26` : 'transparent',
          color: node.isActive ? c.textPrimary : c.textDisabled,
          fontWeight: isSelected ? 600 : 400,
          fontSize: 12.5,
        }}
      >
        <span style={{ width: 11, display: 'inline-block', fontSize: 9, color: c.textSecondary }}>
          {isContainer ? (isOpen ? '▾' : '▸') : ''}
        </span>
        <span aria-hidden style={{ fontSize: 12 }}>{icon}</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {highlight(node.bookName, query)}
        </span>
        <span className="text-mono" style={{ fontSize: 10, color: c.textSecondary }}>
          {node.bookCode}
        </span>
        <Button
          type="text"
          size="small"
          icon={<EditOutlined style={{ fontSize: 10 }} />}
          style={{ width: 18, height: 18, minWidth: 18, padding: 0, color: c.textSecondary }}
          onClick={(e) => { e.stopPropagation(); onEdit(node); }}
        />
      </div>
      {isContainer && isOpen && node.children.map((child) => (
        <TreeNodeRow key={child.bookId} node={child} depth={depth + 1} query={query} matches={matches}
          expanded={expanded} onToggle={onToggle} selectedId={selectedId} onSelect={onSelect} onEdit={onEdit} c={c} />
      ))}
    </div>
  );
}

interface BookTreeExplorerProps {
  books: Book[];
  selectedBookId: number | null;
  onSelectBook: (book: Book) => void;
  onEditBook: (book: Book) => void;
  leadingAction: JSX.Element;
}

/** Recursive, search-filtered tree over the book hierarchy — free-form, any book can nest under any other, however many levels an admin has defined. Every row is selectable (containers also expand/collapse) and carries its own edit affordance. */
export function BookTreeExplorer({ books, selectedBookId, onSelectBook, onEditBook, leadingAction }: BookTreeExplorerProps) {
  const { mode } = useThemeStore();
  const c = paletteFor(mode as ThemeMode);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const tree = useMemo(() => buildTree(books), [books]);
  const matches = useMemo(() => matchIds(tree, query), [tree, query]);

  function toggle(id: number) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: 6, borderBottom: `1px solid ${c.border}` }}>
        {leadingAction}
        <Input
          allowClear
          size="small"
          prefix={<SearchOutlined style={{ color: c.textSecondary, fontSize: 11 }} />}
          placeholder="Search books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 3px' }} role="tree">
        {tree.length === 0 && <Empty style={{ marginTop: 40 }} description="No books" />}
        {isSearchWithNoMatches(tree, query, matches) && <Empty style={{ marginTop: 40 }} description="No matches" />}
        {tree.map((node) => (
          <TreeNodeRow key={node.bookId} node={node} depth={0} query={query} matches={matches}
            expanded={expanded} onToggle={toggle} selectedId={selectedBookId} onSelect={onSelectBook} onEdit={onEditBook} c={c} />
        ))}
      </div>
    </div>
  );
}

function isSearchWithNoMatches(tree: BookTreeNode[], query: string, matches: Set<number>): boolean {
  return query.trim().length > 0 && tree.length > 0 && matches.size === 0;
}

/** Root-to-selected path (inclusive) by walking parentBookId — the tree structure a collapsed tree panel can no longer show directly, surfaced instead as a breadcrumb. */
function ancestorChain(book: Book | null, books: Book[]): Book[] {
  if (!book) return [];
  const byId = new Map(books.map((b) => [b.bookId, b]));
  const chain: Book[] = [];
  let current: Book | undefined = book;
  while (current) {
    chain.unshift(current);
    current = current.parentBookId != null ? byId.get(current.parentBookId) : undefined;
  }
  return chain;
}

// Tree-panel resize — drag the right edge to widen/narrow, persisted across
// sessions. Same ref-based drag pattern as Static Data's sidebar (window
// mousemove/mouseup listeners registered once), kept independent of the main
// app nav sidebar entirely — this only resizes the tree column inside this
// page's own split view.
const TREE_WIDTH_KEY = 'bookhierarchy.treeWidth';
const MIN_TREE_WIDTH = 220;
const MAX_TREE_WIDTH = 520;
const DEFAULT_TREE_WIDTH = 280;

function loadTreeWidth(): number {
  const raw = Number(localStorage.getItem(TREE_WIDTH_KEY));
  if (Number.isFinite(raw) && raw >= MIN_TREE_WIDTH && raw <= MAX_TREE_WIDTH) return raw;
  return DEFAULT_TREE_WIDTH;
}

// Folding the tree panel down to a thin rail — a standard navigator-pane
// affordance (VS Code, Endur's own tree navigator), not "chrome for the
// sake of chrome": some workflows genuinely want the full width for
// positions once a book is selected. The selected book's ancestor path
// renders as a breadcrumb at the top of the details pane while folded, so
// hierarchy context isn't lost.
const TREE_COLLAPSED_KEY = 'bookhierarchy.treeCollapsed';
const COLLAPSED_RAIL_WIDTH = 28;

function loadTreeCollapsed(): boolean {
  return localStorage.getItem(TREE_COLLAPSED_KEY) === '1';
}

function fmtQty(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** One row per (product, period) summed across every leaf book passed in — safe because a product's traded UoM (and, in practice, its settlement currency) is fixed regardless of which book holds it. avgPrice is the abs(netQuantity)-weighted blend of each book's own avgPrice, only when every contributing row shares one currency (shown as "mixed" otherwise rather than silently blending incompatible currencies). */
interface RollupRow {
  key: string;
  productCode: string;
  productName: string;
  periodCode: string;
  quantityUomCode: string;
  netQuantity: number;
  grossBuyQuantity: number;
  grossSellQuantity: number;
  tradeCount: number;
  bookCount: number;
  avgPrice: number | null;
  currencyCode: string | null;
}

function rollupPositions(positions: Position[]): RollupRow[] {
  const acc = new Map<string, RollupRow & { _priceQtySum: number; _currencies: Set<string>; _books: Set<number> }>();
  for (const p of positions) {
    const key = `${p.productId}|${p.periodCode}`;
    let row = acc.get(key);
    if (!row) {
      row = {
        key, productCode: p.productCode, productName: p.productName, periodCode: p.periodCode,
        quantityUomCode: p.quantityUomCode, netQuantity: 0, grossBuyQuantity: 0, grossSellQuantity: 0,
        tradeCount: 0, bookCount: 0, avgPrice: null, currencyCode: p.currencyCode,
        _priceQtySum: 0, _currencies: new Set(), _books: new Set(),
      };
      acc.set(key, row);
    }
    row.netQuantity += p.netQuantity;
    row.grossBuyQuantity += p.grossBuyQuantity;
    row.grossSellQuantity += p.grossSellQuantity;
    row.tradeCount += p.tradeCount;
    row._books.add(p.bookId);
    row._currencies.add(p.currencyCode);
    if (p.avgPrice != null) row._priceQtySum += p.avgPrice * Math.abs(p.netQuantity);
  }
  return Array.from(acc.values()).map((r) => ({
    ...r,
    bookCount: r._books.size,
    currencyCode: r._currencies.size === 1 ? r.currencyCode : null,
    avgPrice: r._currencies.size === 1 && Math.abs(r.netQuantity) > 0 ? r._priceQtySum / Math.abs(r.netQuantity) : null,
  }));
}

function rollupColDefs(): ColDef<RollupRow>[] {
  return [
    {
      headerName: 'Product', field: 'productCode', width: 170,
      cellRenderer: (p: { data: RollupRow }) => (
        <Space direction="vertical" size={0} style={{ lineHeight: 1.3, padding: '4px 0' }}>
          <span className="text-mono" style={{ fontSize: 12 }}>{p.data.productCode}</span>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>{p.data.productName}</Typography.Text>
        </Space>
      ),
    },
    { headerName: 'Period', field: 'periodCode', width: 100, cellClass: 'text-mono' },
    {
      headerName: 'Net Qty (rolled up)', width: 190, type: 'numericColumn',
      cellRenderer: (p: { data: RollupRow }) => {
        const isShort = p.data.netQuantity < 0;
        return (
          <Space size={6}>
            <Tag color={isShort ? 'red' : 'green'} style={{ fontSize: 10, margin: 0 }}>{isShort ? 'SHORT' : 'LONG'}</Tag>
            <span className="text-mono" style={{ color: isShort ? '#dc2626' : '#16a34a', fontSize: 12 }}>
              {fmtQty(Math.abs(p.data.netQuantity))}
            </span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{p.data.quantityUomCode}</Typography.Text>
          </Space>
        );
      },
    },
    {
      headerName: 'Avg Price', width: 130, type: 'numericColumn',
      cellRenderer: (p: { data: RollupRow }) => p.data.avgPrice != null ? (
        <Space size={4}>
          <span className="text-mono" style={{ fontSize: 12 }}>{fmtQty(p.data.avgPrice, 2)}</span>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{p.data.currencyCode}</Typography.Text>
        </Space>
      ) : <Typography.Text type="secondary" style={{ fontSize: 11 }}>mixed / —</Typography.Text>,
    },
    {
      headerName: 'Buys', field: 'grossBuyQuantity', width: 100, type: 'numericColumn',
      cellRenderer: (p: { data: RollupRow }) => <span style={{ color: '#16a34a', fontSize: 12 }}>{fmtQty(p.data.grossBuyQuantity)}</span>,
    },
    {
      headerName: 'Sells', field: 'grossSellQuantity', width: 100, type: 'numericColumn',
      cellRenderer: (p: { data: RollupRow }) => <span style={{ color: '#dc2626', fontSize: 12 }}>{fmtQty(p.data.grossSellQuantity)}</span>,
    },
    { headerName: 'Books', field: 'bookCount', width: 80, type: 'numericColumn' },
    { headerName: 'Trades', field: 'tradeCount', width: 80, type: 'numericColumn' },
  ];
}

function positionColDefs(showBook: boolean): ColDef<Position>[] {
  const bookCol: ColDef<Position>[] = showBook ? [{
    headerName: 'Book', field: 'bookCode', width: 150,
    cellRenderer: (p: { data: Position }) => (
      <Space direction="vertical" size={0} style={{ lineHeight: 1.3, padding: '4px 0' }}>
        <span className="text-mono" style={{ fontSize: 12 }}>{p.data.bookCode}</span>
        <Typography.Text type="secondary" style={{ fontSize: 10 }}>{p.data.bookName}</Typography.Text>
      </Space>
    ),
  }] : [];
  return [
    ...bookCol,
    {
      headerName: 'Product', field: 'productCode', width: 170,
      cellRenderer: (p: { data: Position }) => (
        <Space direction="vertical" size={0} style={{ lineHeight: 1.3, padding: '4px 0' }}>
          <span className="text-mono" style={{ fontSize: 12 }}>{p.data.productCode}</span>
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>{p.data.productName}</Typography.Text>
        </Space>
      ),
    },
    { headerName: 'Period', field: 'periodCode', width: 100, cellClass: 'text-mono' },
    {
      headerName: 'Net Qty', width: 180, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => {
        const isShort = p.data.netQuantity < 0;
        return (
          <Space size={6}>
            <Tag color={isShort ? 'red' : 'green'} style={{ fontSize: 10, margin: 0 }}>{isShort ? 'SHORT' : 'LONG'}</Tag>
            <span className="text-mono" style={{ color: isShort ? '#dc2626' : '#16a34a', fontSize: 12 }}>
              {fmtQty(Math.abs(p.data.netQuantity))}
            </span>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>{p.data.quantityUomCode}</Typography.Text>
          </Space>
        );
      },
    },
    {
      headerName: 'Avg Price', width: 120, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => p.data.avgPrice != null ? (
        <Space size={4}>
          <span className="text-mono" style={{ fontSize: 12 }}>{fmtQty(p.data.avgPrice, 2)}</span>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{p.data.currencyCode}</Typography.Text>
        </Space>
      ) : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      headerName: 'Buys', field: 'grossBuyQuantity', width: 100, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => <span style={{ color: '#16a34a', fontSize: 12 }}>{fmtQty(p.data.grossBuyQuantity)}</span>,
    },
    {
      headerName: 'Sells', field: 'grossSellQuantity', width: 100, type: 'numericColumn',
      cellRenderer: (p: { data: Position }) => <span style={{ color: '#dc2626', fontSize: 12 }}>{fmtQty(p.data.grossSellQuantity)}</span>,
    },
    { headerName: 'Trades', field: 'tradeCount', width: 80, type: 'numericColumn' },
  ];
}

const ROLLUP_HELP = 'Summed by product/period across every leaf book underneath — safe to add since each product keeps one traded UoM regardless of which book holds it. Realized/unrealized P&L dollar figures aren\'t computed by the backend yet — position quantity and (weighted) average entry price are, same limitation as the Position & P&L page.';
const LEAF_HELP = 'Net positions aggregated from confirmed trades. Realized/unrealized P&L dollar figures aren\'t computed by the backend yet — position quantity and average entry price are, same limitation as the Position & P&L page.';
const BY_BOOK_HELP = 'Every position from every leaf Trading Book underneath, unaggregated — use this to see which book is driving the rolled-up number.';

function BookDetailsPane({ book, onEdit, showBreadcrumb, ancestorChain: chain, onSelectAncestor }: {
  book: Book | null;
  onEdit: (book: Book) => void;
  showBreadcrumb: boolean;
  ancestorChain: Book[];
  onSelectAncestor: (bookId: number) => void;
}) {
  const { mode } = useThemeStore();
  const c = paletteFor(mode as ThemeMode);
  const { data: eodStatus = [] } = useBookEodStatus(book?.isLeafNode ? book.bookId : undefined);
  // Every level, however deep, under the selected book — used to roll up a
  // container's positions from its leaf descendants regardless of how many
  // intermediate levels an admin has defined between them.
  const { data: descendants = [] } = useBookDescendants(book?.bookId, book != null && !book.isLeafNode);
  // Fetched once, unfiltered, and sliced client-side below — simplest way to
  // serve both "this one book" and "every leaf under this container" from a
  // single hook call without branching which params are passed to useQuery.
  const { data: allPositions = [], isLoading: loadingPositions, refetch: refetchPositions } = usePositions();
  const [rollupView, setRollupView] = useState<'Rolled Up' | 'By Book'>('Rolled Up');

  const leafDescendantIds = useMemo(
    () => new Set(descendants.filter((d) => d.isLeafNode).map((d) => d.bookId)),
    [descendants],
  );
  const positions = useMemo(() => {
    if (!book) return [];
    if (book.isLeafNode) return allPositions.filter((p) => p.bookId === book.bookId);
    return allPositions.filter((p) => leafDescendantIds.has(p.bookId));
  }, [allPositions, book, leafDescendantIds]);
  const rolledUp = useMemo(() => rollupPositions(positions), [positions]);

  const posColDefs = useMemo(() => positionColDefs(false), []);
  const posColDefsWithBook = useMemo(() => positionColDefs(true), []);
  const rollupCols = useMemo(() => rollupColDefs(), []);

  if (!book) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Empty description="Select a book to view its details — Trading Books show their own positions/P&L, group books (Desk, Strategy, or whatever levels your admins have defined) show a live roll-up from every leaf book underneath them" />
      </div>
    );
  }

  const latestEod = eodStatus[0];
  const statusColor = latestEod?.status === 'LOCKED' ? 'red' : latestEod?.status === 'REOPENED' ? 'orange' : 'green';
  const levelCode = bookLevelTypeCode(book.bookLevelTypeId) ?? 'TRADING_BOOK';
  const rollupTitle = book.isLeafNode
    ? 'Positions & P&L'
    : `Positions & P&L — rolled up (${leafDescendantIds.size} book${leafDescendantIds.size === 1 ? '' : 's'})`;
  const rollupHelp = book.isLeafNode ? LEAF_HELP : rollupView === 'Rolled Up' ? ROLLUP_HELP : BY_BOOK_HELP;

  return (
    <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', height: '100%', fontSize: 12 }}>
      {showBreadcrumb && chain.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4, fontSize: 11, marginBottom: 6, lineHeight: 1.4 }}>
          {chain.map((b, i) => {
            const isLast = i === chain.length - 1;
            return (
              <span key={b.bookId} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {i > 0 && <span style={{ color: c.textDisabled }}>/</span>}
                {isLast ? (
                  <span style={{ color: c.textSecondary }}>
                    <span style={{ fontSize: 11 }}>{LEVEL_ICON[bookLevelTypeCode(b.bookLevelTypeId) ?? 'TRADING_BOOK'] ?? '📄'}</span> {b.bookCode}
                  </span>
                ) : (
                  <a onClick={() => onSelectAncestor(b.bookId)} style={{ cursor: 'pointer', fontSize: 11 }}>
                    <span style={{ fontSize: 11 }}>{LEVEL_ICON[bookLevelTypeCode(b.bookLevelTypeId) ?? 'TRADING_BOOK'] ?? '📄'}</span> {b.bookCode}
                  </a>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Dense fact strip — everything about the book in ~2 short lines,
          always visible, no expand/collapse: the whole point is that this
          shouldn't need a toggle to stay out of the way. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <Space align="center" size={6} wrap>
            <span style={{ fontSize: 15 }}>{LEVEL_ICON[levelCode] ?? '📄'}</span>
            <Typography.Text strong style={{ fontSize: 14 }}>{book.bookName}</Typography.Text>
            <Tag style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>{book.bookCode}</Tag>
            {!book.isActive && <Tag color="red" style={{ fontSize: 10, lineHeight: '16px', margin: 0 }}>Archived</Tag>}
          </Space>
          <div style={{ marginTop: 2, color: c.textSecondary, fontSize: 11, lineHeight: 1.5 }}>
            {bookLevelTypeLabel(book.bookLevelTypeId)} · {bookTypeLabel(book.bookType)} · Entity {book.legalEntityCode}
            {' · '}Parent {book.parentBookCode ?? '—'}
            {' · '}Pos Limit {book.positionLimit != null ? Number(book.positionLimit).toLocaleString() : '—'}
            {' · '}P&amp;L Limit {book.pnlLimit != null ? `$${Number(book.pnlLimit).toLocaleString()}` : '—'}
            {' · '}VaR {book.varLimit != null ? Number(book.varLimit).toLocaleString() : '—'}
            {' · '}Go-Live {book.goLiveDate ?? '—'}
          </div>
        </div>
        <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(book)}>Edit</Button>
      </div>

      <Space size={[5, 5]} wrap style={{ marginTop: 6 }}>
        {!book.isLeafNode ? (
          <Tag style={{ fontSize: 10, margin: 0 }}>EOD n/a — container</Tag>
        ) : latestEod ? (
          <Tag color={statusColor} style={{ fontSize: 10, margin: 0 }}>EOD {latestEod.status} · {latestEod.businessDate}</Tag>
        ) : (
          <Tag style={{ fontSize: 10, margin: 0 }}>EOD: no history</Tag>
        )}
        {book.classifications.map((cl) => (
          <Tag key={cl.bookClassificationId} color={cl.isPrimary ? 'blue' : 'default'} style={{ fontSize: 10, margin: 0 }}>
            {cl.dimensionName}: {cl.valueLabel ?? cl.valueCode}
          </Tag>
        ))}
        {book.traders.filter((t) => t.isActive).map((t) => (
          <Tag key={t.traderId} color="purple" style={{ fontSize: 10, margin: 0 }}>{t.traderName} ({t.role})</Tag>
        ))}
      </Space>

      <div style={{ marginTop: 10, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Space size={5}>
            <Typography.Text strong style={{ fontSize: 12.5 }}>{rollupTitle}</Typography.Text>
            <Tooltip title={rollupHelp}>
              <InfoCircleOutlined style={{ fontSize: 11, color: c.textSecondary, cursor: 'help' }} />
            </Tooltip>
          </Space>
          {!book.isLeafNode && leafDescendantIds.size > 0 && (
            <Segmented size="small" value={rollupView} onChange={(v) => setRollupView(v as 'Rolled Up' | 'By Book')}
              options={['Rolled Up', 'By Book']} />
          )}
        </div>
        {!book.isLeafNode && leafDescendantIds.size === 0 && (
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
            No leaf Trading Books underneath this {bookLevelTypeLabel(book.bookLevelTypeId).toLowerCase()} yet.
          </Typography.Text>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          {book.isLeafNode || leafDescendantIds.size === 0 ? (
            <SmartGrid<Position>
              columnDefs={posColDefs}
              rowData={positions}
              loading={loadingPositions}
              onRefresh={() => { void refetchPositions(); }}
              getRowId={(p) => String(p.data.positionId)}
              height="100%"
              style={{ height: '100%' }}
            />
          ) : rollupView === 'Rolled Up' ? (
            <SmartGrid<RollupRow>
              columnDefs={rollupCols}
              rowData={rolledUp}
              loading={loadingPositions}
              onRefresh={() => { void refetchPositions(); }}
              getRowId={(p) => p.data.key}
              height="100%"
              style={{ height: '100%' }}
            />
          ) : (
            <SmartGrid<Position>
              columnDefs={posColDefsWithBook}
              rowData={positions}
              loading={loadingPositions}
              onRefresh={() => { void refetchPositions(); }}
              getRowId={(p) => String(p.data.positionId)}
              height="100%"
              style={{ height: '100%' }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export function BookTreeExplorerPage() {
  const { data: books = [], isLoading } = useBooks();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const { mode } = useThemeStore();
  const c = paletteFor(mode as ThemeMode);

  const [treeWidth, setTreeWidth] = useState(loadTreeWidth);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, width: 0 });

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const { mouseX, width } = resizeStartRef.current;
      const next = Math.min(MAX_TREE_WIDTH, Math.max(MIN_TREE_WIDTH, width + (e.clientX - mouseX)));
      setTreeWidth(next);
    }
    function handleUp() {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setTreeWidth((w) => {
        localStorage.setItem(TREE_WIDTH_KEY, String(w));
        return w;
      });
    }
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, []);

  function onResizeHandleMouseDown(e: ReactMouseEvent) {
    e.preventDefault();
    resizingRef.current = true;
    resizeStartRef.current = { mouseX: e.clientX, width: treeWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  const [treeCollapsed, setTreeCollapsed] = useState(loadTreeCollapsed);
  function toggleTreeCollapsed() {
    setTreeCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(TREE_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  }

  const activeBooks = useMemo(() => books.filter((b) => b.isActive), [books]);
  const selectedBook = useMemo(() => books.find((b) => b.bookId === selectedId) ?? null, [books, selectedId]);
  const chain = useMemo(() => ancestorChain(selectedBook, books), [selectedBook, books]);

  function openCreate() { setEditingBook(null); setDrawerOpen(true); }
  function openEdit(book: Book) { setEditingBook(book); setDrawerOpen(true); }

  return (
    <>
      {/* Slim, fixed-height toolbar — no expand/collapse control of its own,
          because there's nothing here worth hiding: title, a help tooltip
          for the one paragraph of explanation, and the primary action. */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderLeft: `3px solid ${moduleColor('organization')}`, paddingLeft: 12,
        marginBottom: 10, minHeight: 30,
      }}>
        <Space size={6}>
          <Typography.Text strong style={{ fontSize: 15 }}>Book Hierarchy</Typography.Text>
          <Tooltip title="Free-form book hierarchy — any book can contain others, however many levels your admins have defined (Desk, Strategy, Location, or anything else added under Static Data → Book Level Types). Only leaf books (no children) hold direct postings; select a leaf for its own positions/P&L, or a group book for a live roll-up from every leaf underneath it.">
            <InfoCircleOutlined style={{ fontSize: 13, color: c.textSecondary, cursor: 'help' }} />
          </Tooltip>
        </Space>
        <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openCreate}>
          {selectedBook ? `New Book under ${selectedBook.bookCode}` : 'New Book'}
        </Button>
      </div>

      <div style={{
        display: 'flex',
        height: 'calc(100vh - 130px)',
        minHeight: 560,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        overflow: 'hidden',
        background: c.bgElevated,
      }}>
        {treeCollapsed ? (
          <div style={{
            width: COLLAPSED_RAIL_WIDTH, flexShrink: 0, borderRight: `1px solid ${c.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 6,
          }}>
            <Tooltip title="Expand book tree" placement="right">
              <Button type="text" size="small" icon={<DoubleRightOutlined style={{ fontSize: 11 }} />} onClick={toggleTreeCollapsed} />
            </Tooltip>
          </div>
        ) : (
          <div style={{ width: treeWidth, flexShrink: 0, position: 'relative', borderRight: `1px solid ${c.border}`, display: 'flex', flexDirection: 'column' }}>
            {/* Drag handle — resizes this page's tree column only; independent
                of the main app nav sidebar entirely. */}
            <div
              onMouseDown={onResizeHandleMouseDown}
              style={{ position: 'absolute', top: 0, right: -3, width: 6, height: '100%', cursor: 'col-resize', zIndex: 2 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = c.borderStrong; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            />
            {isLoading ? (
              <div style={{ padding: 20 }}><Typography.Text type="secondary">Loading…</Typography.Text></div>
            ) : (
              <BookTreeExplorer
                books={activeBooks}
                selectedBookId={selectedId}
                onSelectBook={(b) => setSelectedId(b.bookId)}
                onEditBook={openEdit}
                leadingAction={
                  <Tooltip title="Collapse book tree">
                    <Button type="text" size="small" icon={<DoubleLeftOutlined style={{ fontSize: 11 }} />}
                      style={{ width: 22, height: 22, minWidth: 22, padding: 0, flexShrink: 0 }}
                      onClick={toggleTreeCollapsed} />
                  </Tooltip>
                }
              />
            )}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
          <BookDetailsPane
            book={selectedBook}
            onEdit={openEdit}
            showBreadcrumb={treeCollapsed}
            ancestorChain={chain}
            onSelectAncestor={(id) => setSelectedId(id)}
          />
        </div>
      </div>
      <BookFormDrawer
        open={drawerOpen}
        editing={editingBook}
        onClose={() => setDrawerOpen(false)}
        onSaved={(b) => setEditingBook(b)}
        defaultParentBookId={selectedId}
      />
    </>
  );
}
