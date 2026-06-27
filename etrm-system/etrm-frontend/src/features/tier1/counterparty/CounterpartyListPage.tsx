import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Space, Tag, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { buildAgGridTheme } from '@theme/ag-grid-theme';
import { useThemeStore } from '@store/themeStore';
import { useCounterparties, useDeactivateCounterparty } from './hooks';
import { useCustomConfigOptions } from './configLookups';
import type { Counterparty, KycStatus } from './types';

const KYC_TAG_COLOR: Record<string, string> = {
  PENDING: 'default',
  APPROVED: 'success',
  REVIEW: 'processing',
  SUSPENDED: 'warning',
  REJECTED: 'error',
};


export function CounterpartyListPage() {
  const navigate = useNavigate();
  const { data: counterparties, isLoading } = useCounterparties();
  const deactivateMutation = useDeactivateCounterparty();
  const { data: kycStatusOptions = [] } = useCustomConfigOptions('KYC_STATUS');
  const [kycFilter, setKycFilter] = useState<string>('ALL');
  const mode = useThemeStore((s) => s.mode);
  const gridTheme = useMemo(() => buildAgGridTheme(mode), [mode]);

  const filtered = useMemo(
    () => (counterparties ?? []).filter((c) => kycFilter === 'ALL' || c.kycStatus === kycFilter),
    [counterparties, kycFilter],
  );

  const columnDefs = useMemo<ColDef<Counterparty>[]>(
    () => [
      { field: 'cpCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
      { field: 'legalName', headerName: 'Legal Name', flex: 1.4, minWidth: 220 },
      { field: 'cpType', headerName: 'Type', width: 130 },
      { field: 'jurisdiction', headerName: 'Jur.', width: 80, cellClass: 'cell-mono' },
      {
        field: 'kycStatus',
        headerName: 'KYC Status',
        width: 130,
        cellRenderer: (p: { value: KycStatus }) => (
          <Tag color={KYC_TAG_COLOR[p.value]}>{p.value}</Tag>
        ),
      },
      {
        field: 'creditLimit',
        headerName: 'Credit Limit',
        width: 150,
        cellClass: 'cell-mono',
        valueFormatter: (p) =>
          p.value == null ? '—' : `${p.data?.creditLimitCurrency} ${Number(p.value).toLocaleString()}`,
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 100,
        cellRenderer: (p: { value: boolean }) => (
          <Tag color={p.value ? 'success' : 'default'}>{p.value ? 'Active' : 'Inactive'}</Tag>
        ),
      },
      {
        headerName: '',
        width: 110,
        sortable: false,
        filter: false,
        pinned: 'right',
        cellRenderer: (p: { data: Counterparty }) => (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/tier1/counterparty/${p.data.counterpartyId}`)}
            />
            {p.data.isActive && (
              <Popconfirm
                title="Deactivate this counterparty?"
                description="It will be hidden from active lists but kept for history."
                onConfirm={() => deactivateMutation.mutate(p.data.counterpartyId)}
                okText="Deactivate"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" danger icon={<StopOutlined />} />
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [deactivateMutation, navigate],
  );

  return (
    <>
      <PageHeader
        title="Counterparties"
        description="External trading counterparties — contacts, bank accounts, and addresses managed inline."
        moduleGroup="trade"
        extra={
          <Space>
            <Select
              value={kycFilter}
              onChange={setKycFilter}
              options={[{ label: 'All KYC Statuses', value: 'ALL' }, ...kycStatusOptions.map((o) => ({ label: o.label, value: o.value }))]}
              style={{ width: 180 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tier1/counterparty/new')}>
              New Counterparty
            </Button>
          </Space>
        }
      />

      <div style={{ height: 'calc(100vh - 220px)', minHeight: 360 }}>
        <AgGridReact<Counterparty>
          theme={gridTheme}
          rowData={filtered}
          columnDefs={columnDefs}
          loading={isLoading}
          pagination
          paginationPageSize={50}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
        />
      </div>
    </>
  );
}
