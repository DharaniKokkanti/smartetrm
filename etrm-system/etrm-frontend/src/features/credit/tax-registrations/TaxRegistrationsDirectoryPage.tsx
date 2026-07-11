import { useMemo, useState } from 'react';
import { Button, Popconfirm, Space, Tag } from 'antd';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import {
  useAllTaxRegistrations,
  useDeactivateTaxRegistration,
} from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useEntityResolver } from '@features/tier1/guarantee/useEntityResolver';
import { useCountries } from '@features/reference/countries/hooks';
import type { TaxRegistration } from '@features/tier1/counterparty/types';
import { TaxRegistrationDrawer } from './TaxRegistrationDrawer';

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

/** Cross-entity directory of every VAT/GST/tax-ID registration across all
 *  counterparties and legal entities — as opposed to
 *  TaxRegistrationsSection.tsx, which is scoped to one entity's own form
 *  tab. Reuses useEntityResolver for the owning-entity name/type and the
 *  same underlying entity-tax-registrations endpoint (now callable
 *  unscoped). */
export function TaxRegistrationsDirectoryPage() {
  const { data = [], isLoading, refetch } = useAllTaxRegistrations();
  const { resolve } = useEntityResolver();
  const { data: taxTypeOptions = [] } = useCustomConfigOptions('TAX_TYPE');
  const { data: countries = [] } = useCountries();
  const countryLabelById = useMemo(() => new Map(countries.map((c) => [c.countryId, `${c.countryCode} — ${c.countryName}`])), [countries]);
  const deactivate = useDeactivateTaxRegistration();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TaxRegistration | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(r: TaxRegistration) {
    setEditing(r);
    setOpen(true);
  }

  const colDefs = useMemo<ColDef<TaxRegistration>[]>(() => [
    {
      headerName: 'Owning Entity', flex: 1, minWidth: 130, pinned: 'left',
      cellRenderer: (p: { data: TaxRegistration }) => (
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
      headerName: 'Type', width: 100,
      valueGetter: (p) => taxTypeOptions.find((o) => o.value === p.data?.taxType)?.label ?? '—',
    },
    { field: 'taxId', headerName: 'Registration No.', width: 160 },
    { headerName: 'Jurisdiction', width: 100, valueGetter: (p) => p.data ? countryLabelById.get(p.data.jurisdictionId) ?? '—' : '' },
    { field: 'issuingAuthority', headerName: 'Issuing Authority', flex: 1, minWidth: 140, valueFormatter: (p) => p.value ?? '—' },
    { field: 'registrationDate', headerName: 'Registered', width: 110, cellClass: 'cell-mono', valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Primary', width: 90,
      cellRenderer: (p: { value: boolean }) => (p.value ? <Tag color="success">Primary</Tag> : null),
      valueGetter: (p) => p.data?.isPrimary,
    },
    {
      headerName: '', width: 90, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: TaxRegistration }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
          <Popconfirm title="Remove this registration?" onConfirm={() => p.data.taxRegId !== null && deactivate.mutate(p.data.taxRegId)}>
            <Button type="text" size="small" danger icon={<StopOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ], [resolve, taxTypeOptions, deactivate, countryLabelById]);

  return (
    <>
      <PageHeader
        title="Tax Registrations"
        description="Every VAT/GST/tax-ID registration across all counterparties and legal entities — one directory instead of checking each entity's form."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Tax Registration"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => p.data.taxRegId !== null ? String(p.data.taxRegId) : p.data._localId}
      />

      <TaxRegistrationDrawer open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}
