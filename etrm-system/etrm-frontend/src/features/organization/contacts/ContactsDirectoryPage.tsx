import { useMemo, useState } from 'react';
import { Button, Popconfirm, Space, Tag } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import {
  useAllContactAssignments,
  useDeactivateContactAssignment,
} from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useEntityResolver } from '@features/tier1/guarantee/useEntityResolver';
import type { ContactAssignment } from '@features/tier1/counterparty/types';
import { ContactAssignmentDrawer } from './ContactAssignmentDrawer';

const TYPE_COLOR: Record<string, string> = {
  LEGAL_ENTITY: 'geekblue',
  COUNTERPARTY: 'cyan',
  BROKER: 'gold',
};
const TYPE_LABEL: Record<string, string> = {
  LEGAL_ENTITY: 'Legal Entity',
  COUNTERPARTY: 'Counterparty',
  BROKER: 'Broker',
};

/** Cross-entity directory of every contact assigned to any counterparty or
 *  legal entity — as opposed to ContactsSection.tsx, which is scoped to one
 *  entity's own form tab. Reuses the entity-scoped assignment's underlying
 *  API (useAllContactAssignments hits the same GET /entity-contacts endpoint,
 *  unscoped) and useEntityResolver for the owning-entity name/type. */
export function ContactsDirectoryPage() {
  const { data = [], isLoading, refetch } = useAllContactAssignments();
  const { resolve } = useEntityResolver();
  const { data: roleOptions = [] } = useCustomConfigOptions('CONTACT_ROLE');
  const deactivate = useDeactivateContactAssignment();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ContactAssignment | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(r: ContactAssignment) {
    setEditing(r);
    setOpen(true);
  }

  const colDefs = useMemo<ColDef<ContactAssignment>[]>(() => [
    {
      headerName: 'Name', flex: 1, minWidth: 180, pinned: 'left',
      valueGetter: (p) => `${p.data?.contact.firstName ?? ''} ${p.data?.contact.lastName ?? ''}`,
      tooltipValueGetter: (p) => p.value,
    },
    {
      headerName: 'Owning Entity', width: 130,
      cellRenderer: (p: { data: ContactAssignment }) => (
        <Tag color={TYPE_COLOR[p.data.entityType]}>{TYPE_LABEL[p.data.entityType]}</Tag>
      ),
    },
    {
      headerName: 'Entity Name', flex: 1, minWidth: 220,
      valueGetter: (p) => (p.data ? resolve(p.data.entityType, p.data.entityId) : ''),
      tooltipValueGetter: (p) => p.value,
    },
    {
      headerName: 'Role', width: 130,
      valueGetter: (p) => roleOptions.find((o) => o.value === p.data?.contactRole)?.label ?? '—',
    },
    { field: 'contact.jobTitle', headerName: 'Job Title', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'contact.email', headerName: 'Email', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Phone', width: 140,
      valueGetter: (p) => p.data?.contact.phoneMobile || p.data?.contact.phoneDirect || p.data?.contact.phoneMain || '—',
    },
    {
      headerName: 'Primary', width: 90,
      cellRenderer: (p: { value: boolean }) => (p.value ? <Tag color="success">Primary</Tag> : null),
      valueGetter: (p) => p.data?.isPrimary,
    },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: ContactAssignment }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          <Popconfirm title="Remove this contact?" onConfirm={() => p.data.entityContactId !== null && deactivate.mutate(p.data.entityContactId)}>
            <Button type="text" size="small" danger icon={<StopOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [resolve, roleOptions, deactivate]);

  return (
    <>
      <PageHeader
        title="Contacts"
        description="Every named contact across all counterparties and legal entities — trading, credit, legal, and compliance contacts in one directory."
        moduleGroup="organization"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Contact"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => p.data.entityContactId !== null ? String(p.data.entityContactId) : p.data._localId}
      />

      <ContactAssignmentDrawer open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}
