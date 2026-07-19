import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Space, Tag, Popconfirm, Typography, App as AntApp } from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { buildAgGridTheme } from '@theme/ag-grid-theme';
import { useThemeStore } from '@store/themeStore';
import { useDeactivateLegalEntity, useLegalEntities } from './hooks';
import type { LegalEntity, LegalEntityUploadRow } from './types';
import { LegalEntityUploadReviewModal } from './LegalEntityUploadReviewModal';
import { downloadBlob, generateLegalEntityTemplate } from './excelTemplate';
import { parseLegalEntityUpload, type EntityTypeLookupRow } from './excelUpload';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@services/api';
import type { ReferenceDataRow } from '@models/referenceData';
import { useCountries } from '@features/reference/countries/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';

export function LegalEntityListPage() {
  const { data: entities, isLoading } = useLegalEntities();
  const deactivateMutation = useDeactivateLegalEntity();
  const { message } = AntApp.useApp();
  const mode = useThemeStore((s) => s.mode);
  const gridTheme = useMemo(() => buildAgGridTheme(mode), [mode]);
  const [quickFilterText, setQuickFilterText] = useState('');
  // Only earns its screen space once there's enough rows that eyeballing
  // the list stops being practical — driven by the real row count, not a
  // guess about how many legal entities a deployment will have.
  const isLargeTable = (entities?.length ?? 0) > 50;

  // V78: legal_entity.entity_type is a numeric FK id (legal_entity_type
  // parent table) — fetch the raw rows once, used both to resolve the grid's
  // display label and to translate the Excel template's human-readable
  // typeCode column into that id on upload.
  // Query key deliberately distinct from ['lookup', 'legal_entity_type'] —
  // that key belongs to useCustomConfigOptions('LEGAL_ENTITY_TYPE') (used by
  // LegalEntityFormPage), which returns a different shape ({label, value}
  // ConfigOption[], not raw ReferenceData Row[] with
  // typeCode/legalEntityTypeId/typeName). React Query dedupes
  // purely by key, so reusing that key silently fed this component the
  // wrong-shaped cached data — the grid's Type column showed "—" for every
  // row, and the Excel template/upload's typeCode lookup would have quietly
  // broken too. Found via headless-browser verification of the V78 pass.
  const { data: entityTypeRows = [] } = useQuery({
    queryKey: ['legal-entity-type-rows'],
    queryFn: async () => (await apiClient.get<ReferenceDataRow[]>('/reference-data/legal_entity_type')).data,
    staleTime: 5 * 60_000,
  });
  const entityTypeLookup: EntityTypeLookupRow[] = entityTypeRows.map((r) => ({
    typeCode: String(r.typeCode ?? ''),
    legalEntityTypeId: Number(r.legalEntityTypeId),
  }));
  const entityTypeLabel = (id: number) => entityTypeRows.find((r) => r.legalEntityTypeId === id)?.typeName as string | undefined ?? '—';
  const { data: countries = [] } = useCountries();
  const { data: currencies = [] } = useCurrencies();
  const countryCodeById = (id: number) => countries.find((c) => c.countryId === id)?.countryCode ?? '—';
  const currencyCodeById = (id: number) => currencies.find((c) => c.currencyId === id)?.currencyCode ?? '—';

  const navigate = useNavigate();
  const [uploadRows, setUploadRows] = useState<LegalEntityUploadRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    try {
      const rows = await parseLegalEntityUpload(file, entities ?? [], entityTypeLookup, countries, currencies);
      if (rows.length === 0) {
        message.warning('No data rows found in that file.');
        return;
      }
      setUploadRows(rows);
    } catch (err) {
      message.error('Could not read that file — is it a valid .xlsx export of the template?');
      console.error(err);
    }
  }

  async function handleDownloadTemplate() {
    const blob = await generateLegalEntityTemplate(entityTypeLookup.map((r) => r.typeCode));
    downloadBlob(blob, 'legal_entity_upload_template.xlsx');
  }

  const columnDefs = useMemo<ColDef<LegalEntity>[]>(
    () => [
      { field: 'entityCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
      { field: 'entityName', headerName: 'Name', flex: 1.4, minWidth: 200 },
      { field: 'shortName', headerName: 'Short Name', flex: 1 },
      {
        field: 'entityType', headerName: 'Type', width: 150,
        // cellRenderer, not valueFormatter — valueFormatter's output is cached
        // by ag-grid at initial render and doesn't re-run once the async
        // entityTypeRows lookup resolves (confirmed via headless-browser
        // check: every row showed "—" indefinitely). cellRenderer is the
        // pattern that already works elsewhere for the same async-lookup-label
        // shape (ProductsPage's Settlement column, TradeBlotter's Type column).
        cellRenderer: (p: { value: number }) => entityTypeLabel(p.value),
      },
      {
        field: 'jurisdictionId', headerName: 'Jur.', width: 80, cellClass: 'cell-mono',
        cellRenderer: (p: { value: number }) => countryCodeById(p.value),
      },
      {
        field: 'baseCurrencyId', headerName: 'Ccy', width: 80, cellClass: 'cell-mono',
        cellRenderer: (p: { value: number }) => currencyCodeById(p.value),
      },
      {
        field: 'isInternal',
        headerName: 'Internal',
        width: 100,
        cellRenderer: (p: { value: boolean }) => (p.value ? 'Yes' : 'No'),
      },
      {
        field: 'isActive',
        headerName: 'Status',
        width: 110,
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
        cellRenderer: (p: { data: LegalEntity }) => (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/tier1/legal-entity/${p.data.legalEntityId}`)}
              aria-label={`Edit ${p.data.entityCode}`}
            />
            {p.data.isActive && (
              <Popconfirm
                title="Deactivate this legal entity?"
                description="It will be hidden from active lists but kept for history — this does not delete it."
                onConfirm={() => deactivateMutation.mutate(p.data.legalEntityId)}
                okText="Deactivate"
                okButtonProps={{ danger: true }}
              >
                <Button type="text" size="small" danger icon={<StopOutlined />} aria-label="Deactivate" />
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [deactivateMutation, entityTypeRows, countries, currencies, navigate],
  );

  return (
    <>
      <PageHeader
        title="Legal Entities"
        description="Internal trading companies, subsidiaries, and branches."
        moduleGroup="trade"
        extra={
          <Space>
            {isLargeTable && (
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="Search legal entities…"
                value={quickFilterText}
                onChange={(e) => setQuickFilterText(e.target.value)}
                style={{ width: 240 }}
              />
            )}
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              Download Template
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
              Upload Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/tier1/legal-entity/new')}>
              New Legal Entity
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              style={{ display: 'none' }}
              onChange={handleFileSelected}
            />
          </Space>
        }
      />

      <div style={{ height: 'calc(100vh - 220px)', minHeight: 360 }}>
        <AgGridReact<LegalEntity>
          theme={gridTheme}
          rowData={entities ?? []}
          columnDefs={columnDefs}
          loading={isLoading}
          pagination
          paginationPageSize={50}
          defaultColDef={{ sortable: true, filter: true, resizable: true }}
          quickFilterText={quickFilterText}
        />
      </div>

      {(entities?.length ?? 0) === 0 && !isLoading && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          No legal entities yet — add one manually or upload a spreadsheet using the template above.
        </Typography.Text>
      )}

      {uploadRows && (
        <LegalEntityUploadReviewModal
          open={!!uploadRows}
          rows={uploadRows}
          onClose={() => setUploadRows(null)}
          entityTypeLookup={entityTypeLookup}
        />
      )}
    </>
  );
}
