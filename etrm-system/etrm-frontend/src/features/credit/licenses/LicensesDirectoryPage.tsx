import { useMemo, useState } from 'react';
import { Button, Popconfirm, Space, Tag } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import {
  useAllLicenseRegistrations,
  useDeactivateLicenseRegistration,
} from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useEntityResolver } from '@features/tier1/guarantee/useEntityResolver';
import { useCountries } from '@features/reference/countries/hooks';
import type { LicenseRegistration } from '@features/tier1/counterparty/types';
import { LicenseDrawer } from './LicenseDrawer';

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

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  REVOKED: 'error',
  EXPIRED: 'default',
  PENDING_RENEWAL: 'processing',
};

/** Cross-entity directory of every regulatory/trading license across all
 *  counterparties and legal entities — mirrors TaxRegistrationsDirectoryPage
 *  exactly (see that file's doc comment), just against
 *  /entity-license-registrations instead of /entity-tax-registrations. */
export function LicensesDirectoryPage() {
  const { data = [], isLoading, refetch } = useAllLicenseRegistrations();
  const { resolve } = useEntityResolver();
  const { data: licenseTypeOptions = [] } = useCustomConfigOptions('LICENSE_TYPE');
  const { data: countries = [] } = useCountries();
  const countryLabelById = useMemo(() => new Map(countries.map((c) => [c.countryId, `${c.countryCode} — ${c.countryName}`])), [countries]);
  const deactivate = useDeactivateLicenseRegistration();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LicenseRegistration | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(r: LicenseRegistration) {
    setEditing(r);
    setOpen(true);
  }

  const colDefs = useMemo<ColDef<LicenseRegistration>[]>(() => [
    {
      headerName: 'Owning Entity', flex: 1, minWidth: 130, pinned: 'left',
      cellRenderer: (p: { data: LicenseRegistration }) => (
        <Tag color={TYPE_COLOR[p.data.entityType]}>{TYPE_LABEL[p.data.entityType]}</Tag>
      ),
      tooltipValueGetter: (p) => p.data ? TYPE_LABEL[p.data.entityType] : '',
    },
    {
      headerName: 'Entity Name', flex: 1, minWidth: 220,
      valueGetter: (p) => (p.data ? resolve(p.data.entityType, p.data.entityId) : ''),
      tooltipValueGetter: (p) => p.value,
    },
    {
      headerName: 'Type', width: 170,
      valueGetter: (p) => licenseTypeOptions.find((o) => o.value === p.data?.licenseTypeId)?.label ?? '—',
    },
    { field: 'licenseNumber', headerName: 'License No.', width: 170 },
    { headerName: 'Country', width: 100, valueGetter: (p) => p.data ? countryLabelById.get(p.data.countryId) ?? '—' : '' },
    { field: 'regionState', headerName: 'State/Region', width: 120, valueFormatter: (p) => p.value ?? '—' },
    { field: 'issuingAuthority', headerName: 'Issuing Authority', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Status', width: 130,
      cellRenderer: (p: { value: string }) => <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value}</Tag>,
      valueGetter: (p) => p.data?.status,
    },
    { field: 'validTo', headerName: 'Expires', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? 'No expiry' },
    {
      headerName: 'Primary', width: 90,
      cellRenderer: (p: { value: boolean }) => (p.value ? <Tag color="success">Primary</Tag> : null),
      valueGetter: (p) => p.data?.isPrimary,
    },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: LicenseRegistration }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          <Popconfirm title="Remove this license?" onConfirm={() => p.data.licenseRegId !== null && deactivate.mutate(p.data.licenseRegId)}>
            <Button type="text" size="small" danger icon={<StopOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [resolve, licenseTypeOptions, deactivate, countryLabelById]);

  return (
    <>
      <PageHeader
        title="Licenses"
        description="Every regulatory and trading license across all counterparties and legal entities — broker licenses, market participant registrations, import/export licenses, environmental permits."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New License"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => p.data.licenseRegId !== null ? String(p.data.licenseRegId) : p.data._localId}
      />

      <LicenseDrawer open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}
