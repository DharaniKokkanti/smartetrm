import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Space, Tag, Popconfirm, Select } from 'antd';
import { PlusOutlined, EditOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { buildAgGridTheme } from '@theme/ag-grid-theme';
import { useThemeStore } from '@store/themeStore';
import { useCounterparties, useDeactivateCounterparty } from './hooks';
import { useCustomConfigOptions } from './configLookups';
import { useCountries } from '@features/reference/countries/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import type { Counterparty } from './types';

const KYC_TAG_COLOR: Record<string, string> = {
  Pending: 'default',
  Approved: 'success',
  Review: 'processing',
  Suspended: 'warning',
  Rejected: 'error',
};


export function CounterpartyListPage() {
  const navigate = useNavigate();
  const { data: counterparties, isLoading } = useCounterparties();
  const deactivateMutation = useDeactivateCounterparty();
  const { data: cpTypeOptions = [] } = useCustomConfigOptions('COUNTERPARTY_TYPE');
  const { data: kycStatusOptions = [] } = useCustomConfigOptions('KYC_STATUS');
  const { data: countries = [] } = useCountries();
  const { data: currencies = [] } = useCurrencies();
  const countryCodeById = (id: number) => countries.find((c) => c.countryId === id)?.countryCode ?? '—';
  const currencyCodeById = (id: number) => currencies.find((c) => c.currencyId === id)?.currencyCode ?? '—';
  const [kycFilter, setKycFilter] = useState<number | 'ALL'>('ALL');
  const [quickFilterText, setQuickFilterText] = useState('');
  const mode = useThemeStore((s) => s.mode);
  const gridTheme = useMemo(() => buildAgGridTheme(mode), [mode]);

  const filtered = useMemo(
    () => (counterparties ?? []).filter((c) => kycFilter === 'ALL' || c.kycStatus === kycFilter),
    [counterparties, kycFilter],
  );
  // Search box + per-column filters (already always on via defaultColDef
  // below) only earn their space once there's enough rows that eyeballing
  // the list stops being practical — driven by the real row count, not a
  // guess about counterparty volume, so it kicks in automatically as data
  // grows rather than needing a code change later.
  const isLargeTable = filtered.length > 50;

  const columnDefs = useMemo<ColDef<Counterparty>[]>(
    () => [
      { field: 'cpCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
      { field: 'legalName', headerName: 'Legal Name', flex: 1.4, minWidth: 220 },
      {
        // cellRenderer, not valueFormatter — valueFormatter's output is
        // cached at initial render and never re-runs once the async
        // cpTypeOptions lookup resolves (grid showed "—" indefinitely).
        // Matches the kycStatus column below, which already uses cellRenderer
        // for the identical async-lookup-label shape.
        field: 'cpType', headerName: 'Type', width: 130,
        cellRenderer: (p: { value: number }) => cpTypeOptions.find((o) => o.value === p.value)?.label ?? '—',
      },
      {
        field: 'jurisdictionId', headerName: 'Jur.', width: 80, cellClass: 'cell-mono',
        cellRenderer: (p: { value: number }) => countryCodeById(p.value),
      },
      {
        field: 'kycStatus',
        headerName: 'KYC Status',
        width: 130,
        cellRenderer: (p: { value: number }) => {
          const label = kycStatusOptions.find((o) => o.value === p.value)?.label ?? '—';
          return <Tag color={KYC_TAG_COLOR[label]}>{label}</Tag>;
        },
      },
      {
        field: 'creditLimit',
        headerName: 'Credit Limit',
        width: 150,
        cellClass: 'cell-mono',
        valueFormatter: (p) =>
          p.value == null ? '—' : `${currencyCodeById(p.data?.creditLimitCurrencyId ?? 0)} ${Number(p.value).toLocaleString()}`,
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
    [deactivateMutation, navigate, cpTypeOptions, kycStatusOptions, countries, currencies],
  );

  return (
    <>
      <PageHeader
        title="Counterparties"
        description="External trading counterparties — contacts, bank accounts, and addresses managed inline."
        moduleGroup="trade"
        extra={
          <Space>
            {isLargeTable && (
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search counterparties…"
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                style={{ width: 240 }}
              />
            )}
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
          quickFilterText={quickFilterText}
        />
      </div>
    </>
  );
}
