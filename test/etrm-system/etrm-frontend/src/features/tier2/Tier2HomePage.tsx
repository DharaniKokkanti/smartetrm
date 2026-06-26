import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Menu, Empty, Spin } from 'antd';
import { PageHeader } from '@components/layout/PageHeader';
import { useRegisteredTables } from './hooks';
import { ReferenceDataTable } from './ReferenceDataTable';
import type { RegistryEntry } from '@models/referenceData';

export function Tier2HomePage() {
  const { tableName } = useParams();
  const navigate = useNavigate();
  const { data: tables, isLoading } = useRegisteredTables();

  const grouped = useMemo(() => {
    const groups = new Map<string, RegistryEntry[]>();
    for (const t of tables ?? []) {
      if (!t.isEnabled) continue;
      if (!groups.has(t.moduleGroup)) groups.set(t.moduleGroup, []);
      groups.get(t.moduleGroup)!.push(t);
    }
    for (const list of groups.values()) list.sort((a, b) => a.displayOrder - b.displayOrder);
    return groups;
  }, [tables]);

  const activeTable = (tables ?? []).find((t) => t.tableName === tableName);
  const selectedKeys = tableName ? [tableName] : [];

  return (
    <>
      <PageHeader
        title="Reference Data"
        description="Lookup and reference tables — one generic screen, driven by table metadata."
        moduleGroup="freight"
      />
      {isLoading ? (
        <Spin />
      ) : (
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ width: 220, flexShrink: 0 }}>
            <Menu
              mode="inline"
              selectedKeys={selectedKeys}
              items={Array.from(grouped.entries()).map(([group, items]) => ({
                key: group,
                label: group,
                children: items.map((t) => ({ key: t.tableName, label: t.displayName })),
              }))}
              defaultOpenKeys={Array.from(grouped.keys())}
              onClick={({ key }) => navigate(`/tier2/${key}`)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {activeTable ? (
              <ReferenceDataTable table={activeTable} />
            ) : (
              <Empty description="Select a table from the list" style={{ marginTop: 60 }} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
