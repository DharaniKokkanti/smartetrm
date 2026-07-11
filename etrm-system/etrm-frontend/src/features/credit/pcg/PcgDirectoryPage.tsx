import { useMemo, useState } from 'react';
import { Button, Tag } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { useGuarantees } from '@features/tier1/guarantee/hooks';
import { GuaranteeFormDrawer } from '@features/tier1/guarantee/GuaranteeFormDrawer';
import { useEntityResolver } from '@features/tier1/guarantee/useEntityResolver';
import { useCurrencies } from '@features/reference/currencies/hooks';
import type { ParentCompanyGuarantee, PcgStatus } from '@features/tier1/guarantee/types';
import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';

const STATUS_COLOR: Record<PcgStatus, string> = {
  DRAFT: 'default',
  ISSUED: 'success',
  AMENDED: 'processing',
  EXPIRED: 'default',
  CANCELLED: 'default',
  CALLED: 'error',
};

const TYPE_COLOR: Record<PolymorphicEntityType, string> = {
  LEGAL_ENTITY: 'geekblue',
  COUNTERPARTY: 'cyan',
  BROKER: 'gold',
};

/** Cross-entity directory of every Parent Company Guarantee in the system —
 *  as opposed to EntityGuaranteesPanel, which is scoped to one counterparty
 *  or legal entity's form. Reuses useGuarantees() (already unscoped),
 *  GuaranteeFormDrawer, and useEntityResolver as-is; this page is just a new
 *  grid wrapping them. */
export function PcgDirectoryPage() {
  const { data = [], isLoading, refetch } = useGuarantees();
  const { resolve } = useEntityResolver();
  const { data: currencies = [] } = useCurrencies();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ParentCompanyGuarantee | null>(null);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(g: ParentCompanyGuarantee) {
    setEditing(g);
    setOpen(true);
  }

  function partyCell(type: PolymorphicEntityType, id: number) {
    return (
      <span>
        <Tag color={TYPE_COLOR[type]} style={{ marginRight: 4 }}>
          {type === 'LEGAL_ENTITY' ? 'Legal Entity' : type === 'COUNTERPARTY' ? 'Counterparty' : 'Broker'}
        </Tag>
        {resolve(type, id)}
      </span>
    );
  }

  const colDefs = useMemo<ColDef<ParentCompanyGuarantee>[]>(() => [
    { field: 'pcgReference', headerName: 'Reference', width: 150, pinned: 'left' },
    {
      field: 'direction', headerName: 'Direction', width: 100,
      cellRenderer: (p: { value: string }) => <Tag color={p.value === 'RECEIVED' ? 'blue' : 'purple'}>{p.value}</Tag>,
    },
    {
      headerName: 'Guarantor', flex: 1, minWidth: 220, sortable: false, filter: false,
      cellRenderer: (p: { data: ParentCompanyGuarantee }) => partyCell(p.data.guarantorEntityType, p.data.guarantorEntityId),
      tooltipValueGetter: (p) => p.data ? resolve(p.data.guarantorEntityType, p.data.guarantorEntityId) : '',
    },
    {
      headerName: 'Principal', flex: 1, minWidth: 220, sortable: false, filter: false,
      cellRenderer: (p: { data: ParentCompanyGuarantee }) => partyCell(p.data.principalEntityType, p.data.principalEntityId),
      tooltipValueGetter: (p) => p.data ? resolve(p.data.principalEntityType, p.data.principalEntityId) : '',
    },
    {
      headerName: 'Beneficiary', flex: 1, minWidth: 220, sortable: false, filter: false,
      cellRenderer: (p: { data: ParentCompanyGuarantee }) => partyCell(p.data.beneficiaryEntityType, p.data.beneficiaryEntityId),
      tooltipValueGetter: (p) => p.data ? resolve(p.data.beneficiaryEntityType, p.data.beneficiaryEntityId) : '',
    },
    {
      headerName: 'Amount', width: 160,
      valueGetter: (p) => {
        const ccy = currencies.find((c) => c.currencyId === p.data?.currencyId)?.currencyCode ?? '';
        return `${ccy} ${p.data?.guaranteeAmount.toLocaleString() ?? ''}`;
      },
    },
    {
      field: 'pcgStatus', headerName: 'Status', width: 110,
      cellRenderer: (p: { value: PcgStatus }) => <Tag color={STATUS_COLOR[p.value]}>{p.value}</Tag>,
    },
    {
      headerName: 'Expiry', width: 110,
      valueGetter: (p) => (p.data?.isEvergreen ? 'Evergreen' : (p.data?.expiryDate ?? '—')),
    },
    {
      field: 'isActive', headerName: 'Active', width: 90,
      cellRenderer: (p: { value: boolean }) => <Tag color={p.value ? 'success' : 'default'}>{p.value ? 'Yes' : 'No'}</Tag>,
    },
    {
      headerName: '', width: 60, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: ParentCompanyGuarantee }) => (
        <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(p.data)} />
      ),
    },
  ], [currencies, resolve]);

  return (
    <>
      <PageHeader
        title="Parent Company Guarantees"
        description="Every parent company guarantee across all counterparties and legal entities — received (their parent backs them to us) and issued (our parent backs us to them)."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={openNew}
        addLabel="New Guarantee"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.pcgId)}
      />

      <GuaranteeFormDrawer open={open} onClose={() => setOpen(false)} editing={editing} />
    </>
  );
}
