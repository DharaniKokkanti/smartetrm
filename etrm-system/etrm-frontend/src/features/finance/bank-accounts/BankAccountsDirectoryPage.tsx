import { useMemo, useState } from 'react';
import { Button, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { useAllBankAccounts } from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useEntityResolver } from '@features/tier1/guarantee/useEntityResolver';
import { useCurrencies } from '@features/reference/currencies/hooks';
import type { BankAccount } from '@features/tier1/counterparty/types';
import { BankAccountDrawer } from './BankAccountDrawer';

/** Cross-entity directory of every bank account across all counterparties —
 *  as opposed to BankAccountsSection.tsx, which is scoped to one
 *  counterparty's own form tab. Bank accounts are counterparty-owned only
 *  (see BankAccountDrawer's note), so the "owning entity" tag here is always
 *  Counterparty — still resolved to its real name via useEntityResolver
 *  rather than shown as a raw id. */
export function BankAccountsDirectoryPage() {
  const { data = [], isLoading, refetch } = useAllBankAccounts();
  const { resolve } = useEntityResolver();
  const { data: typeOptions = [] } = useCustomConfigOptions('BANK_ACCOUNT_TYPE');
  const { data: currencies = [] } = useCurrencies();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(r: BankAccount) {
    setEditing(r);
    setOpen(true);
  }

  const colDefs = useMemo<ColDef<BankAccount>[]>(() => [
    {
      headerName: 'Owning Entity', width: 130, pinned: 'left',
      cellRenderer: () => <Tag color="cyan">Counterparty</Tag>,
    },
    {
      headerName: 'Entity Name', flex: 1, minWidth: 220,
      valueGetter: (p) => (p.data ? resolve('COUNTERPARTY', p.data.entityId) : ''),
      tooltipValueGetter: (p) => p.value,
    },
    { field: 'accountName', headerName: 'Account Name', flex: 1, minWidth: 160 },
    { field: 'bankName', headerName: 'Bank', flex: 1, minWidth: 140 },
    {
      headerName: 'Type', width: 110,
      valueGetter: (p) => typeOptions.find((o) => o.value === p.data?.accountType)?.label ?? '—',
    },
    {
      headerName: 'Currency', width: 90,
      valueGetter: (p) => currencies.find((c) => c.currencyId === p.data?.currencyId)?.currencyCode ?? '—',
    },
    { field: 'swiftBic', headerName: 'SWIFT/BIC', width: 110, valueFormatter: (p) => p.value ?? '—' },
    { field: 'iban', headerName: 'IBAN', flex: 1, minWidth: 160, valueFormatter: (p) => p.value ?? '—' },
    {
      headerName: 'Primary', width: 90,
      cellRenderer: (p: { value: boolean }) => (p.value ? <Tag color="success">Primary</Tag> : null),
      valueGetter: (p) => p.data?.isPrimary,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: BankAccount }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], [resolve, typeOptions, currencies]);

  return (
    <>
      <PageHeader
        title="Bank Accounts"
        description="Every settlement, collateral, and fee bank account across all counterparties — one directory instead of checking each counterparty's form."
        moduleGroup="finance"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Bank Account"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => p.data.bankAccountId !== null ? String(p.data.bankAccountId) : p.data._localId}
      />

      <BankAccountDrawer open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}
