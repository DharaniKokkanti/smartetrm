import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Input, Spin, Empty, Typography } from 'antd';
import { SearchOutlined, RightOutlined, DownOutlined, LinkOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { PageHeader } from '@components/layout/PageHeader';
import { useRegisteredTables } from './hooks';
import { ReferenceDataTable } from './ReferenceDataTable';
import type { RegistryEntry } from '@models/referenceData';

const { Text, Paragraph } = Typography;

// Canonical sidebar order — groups not listed here are appended at the end
const GROUP_ORDER = [
  'Organisation', 'Trade', 'Counterparty', 'Commercial',
  'Products', 'Logistics', 'Reference', 'Freight', 'Power',
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

  function toggleGroup(group: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
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

  const activeTable = (tables ?? []).find((t) => t.tableName === tableName);
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
            width: 220,
            flexShrink: 0,
            borderRight: '1px solid #f0f0f0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}>
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

          {/* ── Content area ────────────────────────────────────────────── */}
          <div style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '0 24px 24px' }}>
            {activeTable ? (
              <>
                <DescriptionPanel table={activeTable} />
                <ReferenceDataTable table={activeTable} />
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
