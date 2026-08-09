import { useMemo } from 'react';
import { Button, Space, Popconfirm, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { EditOutlined, StopOutlined } from '@ant-design/icons';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { SmartGrid } from '@components/smart/SmartGrid';
import { ActiveTag } from '@components/smart/StatusTag';
import { useClearingAccounts, useDeactivateClearingAccount } from './hooks';
import type { ClearingAccount } from './types';

const METHOD_COLOR: Record<string, string> = { SPAN: 'blue', VAR: 'green', GRID_FLAT: 'purple' };

export function ClearingAccountsPage() {
  const { data = [], isLoading, refetch } = useClearingAccounts();
  const deactivate = useDeactivateClearingAccount();
  const navigate = useNavigate();

  const colDefs = useMemo<ColDef<ClearingAccount>[]>(() => [
    { field: 'accountCode', headerName: 'Account Code', width: 170, pinned: 'left', cellClass: 'cell-mono' },
    { field: 'accountName', headerName: 'Account Name', flex: 1, minWidth: 160 },
    { field: 'clearingBrokerName', headerName: 'Clearing Broker (FCM)', flex: 1, minWidth: 160 },
    { field: 'legalEntityName', headerName: 'Legal Entity', flex: 1, minWidth: 140 },
    { field: 'baseCurrencyCode', headerName: 'Base Ccy', width: 100 },
    { field: 'marginCalcMethod', headerName: 'Calc Method', width: 120, cellRenderer: (p: { value: string }) => <Tag color={METHOD_COLOR[p.value] ?? 'default'} style={{ fontSize: 10 }}>{p.value}</Tag> },
    {
      field: 'isActive', headerName: 'Active', width: 80,
      cellRenderer: (p: { value: boolean }) => <ActiveTag active={p.value} />,
    },
    {
      headerName: '', width: 80, sortable: false, filter: false, pinned: 'right',
      cellRenderer: (p: { data: ClearingAccount }) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => navigate(`/credit/clearing-accounts/${p.data.clearingAccountId}`)} />
          {p.data.isActive && (
            <Popconfirm title="Deactivate this clearing account?" onConfirm={() => deactivate.mutate(p.data.clearingAccountId)} okText="Deactivate" okButtonProps={{ danger: true }}>
              <Button type="text" size="small" danger icon={<StopOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [deactivate, navigate]);

  return (
    <>
      <PageHeader
        title="Clearing Accounts"
        description="FCM/clearing-broker-level accounts a legal entity holds margin balances under — one account can span multiple markets. Margin accounts allocate balances per market under one of these."
        moduleGroup="credit"
      />
      <SmartGrid
        columnDefs={colDefs}
        rowData={data}
        loading={isLoading}
        onAdd={() => navigate('/credit/clearing-accounts/new')}
        addLabel="New Clearing Account"
        onRefresh={() => { void refetch(); }}
        getRowId={(p) => String(p.data.clearingAccountId)}
      />
    </>
  );
}
