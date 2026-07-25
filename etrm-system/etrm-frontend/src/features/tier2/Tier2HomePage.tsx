import { useState, useMemo, useEffect, useRef } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Spin, Empty, Typography } from 'antd';
import { SearchOutlined, RightOutlined, DownOutlined, LinkOutlined } from '@ant-design/icons';
import { PageHeader } from '@components/layout/PageHeader';
import { InfoPanel } from '@components/smart/InfoPanel';
import { color } from '@theme/tokens';
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

// Canonical sidebar order — mirrors the Master Data Hub's own GROUPS order
// exactly (MasterDataHub.tsx), so a card clicked in the Hub lands in a
// sidebar group with the same name in the same relative position. Groups
// not listed here are appended at the end. Previously only listed 12 of the
// Hub's 18 groups — the other 6 (User Management, Physical Operations,
// Supply & Distribution, Voyage & Charter Ops, Calendar & Periods, Sanctions
// & Regulatory Reporting) silently sorted to the bottom here regardless of
// their real position in the Hub, contradicting this comment's own stated
// intent — found during a GUI navigation-consistency audit.
const GROUP_ORDER = [
  'Organization & Users', 'User Management', 'Counterparties & Agreements',
  'Credit & Collateral', 'Products & Markets', 'Contract & Legal',
  'Physical Operations', 'Logistics & Delivery', 'Supply & Distribution',
  'Freight & Shipping', 'Voyage & Charter Ops', 'Power & Energy',
  'Calendar & Periods', 'Pricing & Rates', 'Finance & Settlement',
  'Sanctions & Regulatory Reporting', 'RIN & Renewable Fuels', 'Carbon & Environmental',
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
  // Always render — table.displayName is this page's only title/label.
  // description/links are optional extras below it, not a gate on whether
  // the label itself shows: most registry rows have no description text
  // populated, and hiding the whole panel for those left ~150 Static Data
  // pages with no page title at all, just a highlighted sidebar item.
  return (
    <InfoPanel variant="neutral">
      <Text strong style={{ fontSize: 14 }}>{table.displayName}</Text>
      {table.description && (
        <Paragraph style={{ margin: '3px 0 0', fontSize: 12.5, color: color.textSecondary, lineHeight: 1.55 }}>
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
    </InfoPanel>
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
    const isFirstLoad = lastAutoKey === null;
    setLastAutoKey(autoKey);
    const next = new Set(allGroupNames);
    if (activeTable) {
      next.delete(activeTable.moduleGroup);
    } else if (isFirstLoad) {
      // Landing on /static-data with no table selected yet — leaving every
      // group collapsed left the whole content area blank behind a sidebar
      // of headers with nothing to click first. Open the first group instead
      // (canonical GROUP_ORDER, same order the sidebar renders in) so there's
      // something to see and pick from immediately.
      const firstGroup = GROUP_ORDER.find((g) => allGroupNames.has(g)) ?? [...allGroupNames][0];
      next.delete(firstGroup);
    }
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
        // Single page-level scroll surface: the sidebar is `position: sticky`
        // with no height cap of its own (no independent scrollbar), so the
        // browser's normal document scroll is the only vertical scrollbar on
        // this screen. Previously both the sidebar and the content area had
        // their own `overflowY: auto` inside a fixed-height wrapper, which
        // produced two separate vertical scrollbars side by side plus the
        // table's own horizontal scrollbar — three scroll surfaces to manage
        // at once. The table's `scroll={{ x: 'max-content' }}` (in
        // ReferenceDataTable) still scrolls horizontally on its own, but
        // that's contained to the table, not the whole page.
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>

          {/* ── Sidebar ─────────────────────────────────────────────────── */}
          <div style={{
            width: sidebarWidth,
            flexShrink: 0,
            position: 'sticky',
            top: 12,
            borderRight: `1px solid ${color.border}`,
          }}>
            {/* Drag handle — resizes the sidebar; leaves the main app sidebar untouched. */}
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
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = color.borderStrong; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            />

            <div style={{ padding: '10px 10px 6px', background: color.bgElevated }}>
              <Input
                prefix={<SearchOutlined style={{ color: color.textDisabled, fontSize: 12 }} />}
                placeholder="Filter tables…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                allowClear
                size="small"
              />
            </div>

            <div>
              {grouped.length === 0 && (
                <div style={{ padding: '20px 12px', color: color.textDisabled, fontSize: 12, textAlign: 'center' }}>
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
                          color: color.textSecondary,
                          letterSpacing: '0.5px',
                          textTransform: 'uppercase',
                          userSelect: 'none',
                          cursor: isFiltering ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                        onMouseEnter={(e) => { if (!isFiltering) (e.currentTarget as HTMLElement).style.color = color.textPrimary; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = color.textSecondary; }}
                      >
                        {!isFiltering && (
                          isCollapsed
                            ? <RightOutlined style={{ fontSize: 9 }} />
                            : <DownOutlined style={{ fontSize: 9 }} />
                        )}
                        {group}
                        <span style={{
                          marginLeft: 'auto',
                          background: color.bg,
                          borderRadius: 8,
                          padding: '0 5px',
                          fontSize: 10,
                          fontWeight: 500,
                          color: color.textDisabled,
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

          {/* ── Content area ────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, padding: '0 24px 24px' }}>
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
        borderLeft: `2px solid ${active ? color.moduleTier2 : 'transparent'}`,
        background: active ? `${color.moduleTier2}14` : hovered ? color.bg : 'transparent',
        color: active ? color.moduleTier2 : color.textPrimary,
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
