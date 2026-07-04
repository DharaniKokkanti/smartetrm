import { useState, useMemo, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Spin, Empty, Typography } from 'antd';
import { SearchOutlined, RightOutlined, DownOutlined, LinkOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '@components/layout/PageHeader';
import { useRegisteredTables } from './hooks';
import { ReferenceDataTable } from './ReferenceDataTable';
import type { RegistryEntry } from '@models/referenceData';

const { Text, Paragraph } = Typography;

const SIDEBAR_WIDTH_KEY = 'staticdata.sidebarWidth';
const MIN_SIDEBAR_WIDTH = 180;
const MAX_SIDEBAR_WIDTH = 480;
const DEFAULT_SIDEBAR_WIDTH = 220;

function loadSidebarWidth(): number {
  const raw = Number(localStorage.getItem(SIDEBAR_WIDTH_KEY));
  if (Number.isFinite(raw) && raw >= MIN_SIDEBAR_WIDTH && raw <= MAX_SIDEBAR_WIDTH) return raw;
  return DEFAULT_SIDEBAR_WIDTH;
}

// Canonical sidebar order — mirrors the Master Data Hub's own group order, so
// a card clicked in the Hub lands in a sidebar group with the same name in
// the same relative position. Groups not listed here are appended at the end.
const GROUP_ORDER = [
  'Organization & Users', 'Counterparties & Agreements', 'Credit & Collateral',
  'Products & Markets', 'Contract & Legal', 'Logistics & Delivery',
  'Freight & Shipping', 'Power & Energy', 'Pricing & Rates',
  'Finance & Settlement', 'Carbon & Environmental', 'RIN & Renewable Fuels',
];

function sortedGroupEntries(map: Map<string, RegistryEntry[]>): [string, RegistryEntry[]][] {
  return [...map.entries()].sort(([a], [b]) => {
    const ai = GROUP_ORDER.indexOf(a);
    const bi = GROUP_ORDER.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

// External reference links for specific tables
const EXTERNAL_LINKS: Record<string, { label: string; url: string }[]> = {
  currency: [
    { label: 'ISO 4217 Currency Codes', url: 'https://www.iso.org/iso-4217-currency-codes.html' },
    { label: 'Full list (Wikipedia)', url: 'https://en.wikipedia.org/wiki/ISO_4217' },
  ],
  incoterm: [
    { label: 'ICC Incoterms® 2020', url: 'https://iccwbo.org/resources-for-business/incoterms-rules/incoterms-2020/' },
  ],
  country: [
    { label: 'ISO 3166-1 Country Codes', url: 'https://www.iso.org/iso-3166-country-codes.html' },
  ],
};

// ── Description panel ──────────────────────────────────────────────────────────
function DescriptionPanel({ table }: { table: RegistryEntry }) {
  const links = EXTERNAL_LINKS[table.tableName] ?? [];
  if (!table.description && links.length === 0) return null;
  return (
    <div style={{
      background: '#f6f8fa',
      border: '1px solid #e8ebee',
      borderRadius: 6,
      padding: '10px 16px',
      marginBottom: 16,
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <InfoCircleOutlined style={{ color: '#1677ff', fontSize: 14, marginTop: 2, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Text strong style={{ fontSize: 13 }}>{table.displayName}</Text>
        {table.description && (
          <Paragraph style={{ margin: '3px 0 0', fontSize: 12.5, color: '#4b5563', lineHeight: 1.55 }}>
            {table.description}
          </Paragraph>
        )}
        {links.length > 0 && (
          <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {links.map((lnk) => (
              <a key={lnk.url} href={lnk.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <LinkOutlined style={{ fontSize: 11 }} />{lnk.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Tier2HomePage() {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const { data: tables, isLoading } = useRegisteredTables();
  const [filter, setFilter] = useState('');
  // Set of group names that are collapsed
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  // Sidebar resize — drag the right edge to widen/narrow, persisted across
  // sessions. Uses the same ref-based drag pattern as the modal drag handle
  // (window mousemove/mouseup listeners registered once on mount) so the
  // resize keeps tracking the cursor even if it moves faster than React
  // re-renders.
  const [sidebarWidth, setSidebarWidth] = useState(loadSidebarWidth);
  const resizingRef = useRef(false);
  const resizeStartRef = useRef({ mouseX: 0, width: 0 });

  useEffect(() => {
    function handleMove(e: MouseEvent) {
      if (!resizingRef.current) return;
      const { mouseX, width } = resizeStartRef.current;
      const next = Math.min(MAX_SIDEBAR_WIDTH, Math.max(MIN_SIDEBAR_WIDTH, width + (e.clientX - mouseX)));
      setSidebarWidth(next);
    }
    function handleUp() {
      if (!resizingRef.current) return;
      resizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setSidebarWidth((w) => {
        localStorage.setItem(SIDEBAR_WIDTH_KEY, String(w));
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
    resizeStartRef.current = { mouseX: e.clientX, width: sidebarWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  const allGroupNames = useMemo(
    () => new Set((tables ?? []).filter((t) => t.isEnabled).map((t) => t.moduleGroup)),
    [tables],
  );

  const activeTable = (tables ?? []).find((t) => t.tableName === tableName);

  // Accordion behaviour, driven by which table is selected: whenever the
  // selected table (and therefore its group) changes — including arriving
  // here via a Master Data Hub card click — collapse every other group down
  // to just its header, leaving only the active table's group expanded. With
  // nothing selected yet, every group starts collapsed (headers only).
  //
  // This adjusts state during render (React's documented pattern for "reset
  // state when a prop changes", https://react.dev/learn/you-might-not-need-an-effect)
  // rather than in a useEffect, guarded by a "last seen selection" marker so
  // it only fires once per actual navigation, not on every render — manual
  // header clicks via toggleGroup are left alone in between.
  const autoKey = `${tableName ?? ''}::${[...allGroupNames].sort().join(',')}`;
  const [lastAutoKey, setLastAutoKey] = useState<string | null>(null);
  if (allGroupNames.size > 0 && autoKey !== lastAutoKey) {
    setLastAutoKey(autoKey);
    const next = new Set(allGroupNames);
    if (activeTable) next.delete(activeTable.moduleGroup);
    setCollapsed(next);
  }

  function toggleGroup(group: string) {
    setCollapsed((prev) => {
      if (prev.has(group)) {
        // Expanding this group — collapse all others (single-open accordion,
        // matching the main app sidebar's behaviour).
        const next = new Set(allGroupNames);
        next.delete(group);
        return next;
      }
      // Collapsing this group — leave the others as they are.
      return new Set(prev).add(group);
    });
  }

  const grouped = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const map = new Map<string, RegistryEntry[]>();
    for (const t of tables ?? []) {
      if (!t.isEnabled) continue;
      if (q && !t.displayName.toLowerCase().includes(q) && !t.tableName.toLowerCase().includes(q)) continue;
      if (!map.has(t.moduleGroup)) map.set(t.moduleGroup, []);
      map.get(t.moduleGroup)!.push(t);
    }
    for (const list of map.values()) list.sort((a, b) => a.displayOrder - b.displayOrder);
    return sortedGroupEntries(map);
  }, [tables, filter]);

  const isFiltering = filter.trim().length > 0;

  return (
    <>
      <PageHeader
        title="Static Data"
        description="Classification tables and lookup values — the drop-down options, FK targets, and validation rules that drive the rest of the system."
        moduleGroup="freight"
      />

      {isLoading ? (
        <Spin style={{ display: 'block', marginTop: 60 }} />
      ) : (
        <div style={{ display: 'flex', height: 'calc(100vh - 150px)', overflow: 'hidden' }}>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div style={{
            width: sidebarWidth,
            flexShrink: 0,
            position: 'relative',
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Drag handle — resizes the sidebar; leaves the main app sidebar untouched.
                Sits on this non-scrolling wrapper (not the inner overflowY:auto div)
                so its half-outside overhang isn't clipped by the scroll container. */}
            <div
              onMouseDown={onResizeHandleMouseDown}
              style={{
                position: 'absolute',
                top: 0,
                right: -3,
                width: 6,
                height: '100%',
                cursor: 'col-resize',
                zIndex: 2,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = '#d9d9d9'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            />

            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ padding: '10px 10px 6px', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
                <Input
                  prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: 12 }} />}
                  placeholder="Filter tables…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  allowClear
                  size="small"
                />
              </div>

              <div style={{ flex: 1 }}>
                {grouped.length === 0 && (
                  <div style={{ padding: '20px 12px', color: '#bfbfbf', fontSize: 12, textAlign: 'center' }}>
                    No tables match "{filter}"
                  </div>
                )}

                {grouped.map(([group, items]) => {
                  const isCollapsed = !isFiltering && collapsed.has(group);
                  return (
                    <div key={group} style={{ marginBottom: 4 }}>
                      {/* Group header — clickable to expand/collapse */}
                      <div
                        onClick={() => !isFiltering && toggleGroup(group)}
                        style={{
                          padding: '8px 10px 6px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#6b7280',
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          userSelect: 'none',
                          cursor: isFiltering ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                        onMouseEnter={(e) => { if (!isFiltering) (e.currentTarget as HTMLElement).style.color = '#374151'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#6b7280'; }}
                      >
                        {!isFiltering && (
                          isCollapsed
                            ? <RightOutlined style={{ fontSize: 9 }} />
                            : <DownOutlined style={{ fontSize: 9 }} />
                        )}
                        {group}
                        <span style={{
                          marginLeft: 'auto',
                          background: '#f0f0f0',
                          borderRadius: 8,
                          padding: '0 5px',
                          fontSize: 10,
                          fontWeight: 500,
                          color: '#9ca3af',
                        }}>
                          {items.length}
                        </span>
                      </div>

                      {/* Items — hidden when group is collapsed */}
                      {!isCollapsed && items.map((t) => (
                        <NavItem
                          key={t.tableName}
                          label={t.displayName}
                          active={t.tableName === tableName}
                          onClick={() => navigate(`/static-data/${t.tableName}`)}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Content area ────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 24px 24px' }}>
            {activeTable ? (
              <>
                <DescriptionPanel table={activeTable} />
                <ReferenceDataTable key={activeTable.tableName} table={activeTable} />
              </>
            ) : (
              <Empty
                description="Select a table from the list on the left"
                style={{ marginTop: 80 }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function NavItem({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '5px 12px 5px 22px',
        cursor: 'pointer',
        fontSize: 13,
        lineHeight: '20px',
        borderLeft: `2px solid ${active ? '#1890ff' : 'transparent'}`,
        background: active ? '#e6f4ff' : hovered ? '#fafafa' : 'transparent',
        color: active ? '#1677ff' : '#262626',
        fontWeight: active ? 500 : 400,
        transition: 'background 0.1s',
        borderRadius: '0 4px 4px 0',
        marginRight: 4,
      }}
    >
      {label}
    </div>
  );
}
