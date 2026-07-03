import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Button, Space, Tag, Popconfirm, Typography, App as AntApp } from 'antd';
import {
  PlusOutlined,
  UploadOutlined,
  DownloadOutlined,
  EditOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef } from 'ag-grid-community';
import { PageHeader } from '@components/layout/PageHeader';
import { buildAgGridTheme } from '@theme/ag-grid-theme';
import { useThemeStore } from '@store/themeStore';
import { useDeactivateLegalEntity, useLegalEntities } from './hooks';
import type { LegalEntity, LegalEntityUploadRow } from './types';
import { LegalEntityFormDrawer } from './LegalEntityFormDrawer';
import { LegalEntityUploadReviewModal } from './LegalEntityUploadReviewModal';
import { downloadBlob, generateLegalEntityTemplate } from './excelTemplate';
import { parseLegalEntityUpload } from './excelUpload';
import { useDraftState } from '@components/smart/formDraft';

export function LegalEntityListPage() {
  const { data: entities, isLoading } = useLegalEntities();
  const deactivateMutation = useDeactivateLegalEntity();
  const { message } = AntApp.useApp();
  const mode = useThemeStore((s) => s.mode);
  const gridTheme = useMemo(() => buildAgGridTheme(mode), [mode]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<LegalEntity | null>(null);
  useDraftState('tier1-legal-entity', { open: drawerOpen, setOpen: setDrawerOpen, editing, setEditing });
  const [uploadRows, setUploadRows] = useState<LegalEntityUploadRow[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }
  function openEdit(entity: LegalEntity) {
    setEditing(entity);
    setDrawerOpen(true);
  }

  async function handleFileSelected(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    try {
      const rows = await parseLegalEntityUpload(file, entities ?? []);
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
    const blob = await generateLegalEntityTemplate();
    downloadBlob(blob, 'legal_entity_upload_template.xlsx');
  }

  const columnDefs = useMemo<ColDef<LegalEntity>[]>(
    () => [
      { field: 'entityCode', headerName: 'Code', cellClass: 'cell-mono', width: 130, pinned: 'left' },
      { field: 'entityName', headerName: 'Name', flex: 1.4, minWidth: 200 },
      { field: 'shortName', headerName: 'Short Name', flex: 1 },
      { field: 'entityType', headerName: 'Type', width: 150 },
      { field: 'jurisdiction', headerName: 'Jur.', width: 80, cellClass: 'cell-mono' },
      { field: 'baseCurrency', headerName: 'Ccy', width: 80, cellClass: 'cell-mono' },
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
              onClick={() => openEdit(p.data)}
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
    [deactivateMutation],
  );

  return (
    <>
      <PageHeader
        title="Legal Entities"
        description="Internal trading companies, subsidiaries, and branches."
        moduleGroup="trade"
        extra={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleDownloadTemplate}>
              Download Template
            </Button>
            <Button icon={<UploadOutlined />} onClick={() => fileInputRef.current?.click()}>
              Upload Excel
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
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
        />
      </div>

      {(entities?.length ?? 0) === 0 && !isLoading && (
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          No legal entities yet — add one manually or upload a spreadsheet using the template above.
        </Typography.Text>
      )}

      <LegalEntityFormDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editing={editing} onSaved={(e) => setEditing(e)} />

      {uploadRows && (
        <LegalEntityUploadReviewModal
          open={!!uploadRows}
          rows={uploadRows}
          onClose={() => setUploadRows(null)}
        />
      )}
    </>
  );
}
