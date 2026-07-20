import { useState } from 'react';
import { Modal, Button, Upload, Table, Tag, Space, App as AntApp } from 'antd';
import { DownloadOutlined, InboxOutlined } from '@ant-design/icons';
import type { ColumnMetadata } from '@models/referenceData';
import { downloadUploadTemplate, parseUploadFile, type UploadRow } from './excelUpload';
import { referenceDataApi } from './api';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  open: boolean;
  onClose: () => void;
  tableName: string;
  displayName: string;
  columns: ColumnMetadata[];
}

/**
 * Generic bulk-upload for any Tier2 table with allowExcelUpload=1 —
 * download a template shaped from the table's own live metadata, fill it
 * in, upload, review the parsed/validated rows (bad rows stay editable-only
 * in the spreadsheet, not silently dropped), then import just the valid
 * ones one at a time through the same POST the Add form already uses — no
 * new backend endpoint, matches the same create() path and its validation.
 */
export function ExcelUploadModal({ open, onClose, tableName, displayName, columns }: Props) {
  const { message, notification } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<UploadRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  function reset() {
    setRows([]);
    setFileName(null);
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    try {
      const parsed = await parseUploadFile(file, columns);
      setRows(parsed);
      if (parsed.length === 0) message.warning('No data rows found in that file.');
    } catch {
      message.error('Could not read that file — is it a valid .xlsx?');
      setRows([]);
    }
    return false; // prevent antd Upload's own auto-upload
  }

  async function handleImport() {
    setImporting(true);
    let succeeded = 0;
    const failures: string[] = [];
    for (const row of validRows) {
      try {
        await referenceDataApi.createRow(tableName, row.values);
        succeeded++;
      } catch {
        failures.push(`Row ${row.rowNumber}`);
      }
    }
    setImporting(false);
    queryClient.invalidateQueries({ queryKey: ['reference-data', tableName, 'rows'] });
    if (failures.length === 0) {
      notification.success({ message: `Imported ${succeeded} row${succeeded === 1 ? '' : 's'}.` });
      reset();
      onClose();
    } else {
      notification.warning({
        message: `Imported ${succeeded} of ${validRows.length} rows`,
        description: `Failed: ${failures.join(', ')}. Fix and re-upload just those rows.`,
        duration: 0,
      });
    }
  }

  const previewColumns = [
    { title: 'Row', dataIndex: 'rowNumber', width: 70 },
    ...columns.slice(0, 5).map((c) => ({
      title: c.label,
      key: c.name,
      render: (_: unknown, r: UploadRow) => String(r.values[c.name] ?? ''),
    })),
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, r: UploadRow) =>
        r.errors.length === 0
          ? <Tag color="success">OK</Tag>
          : <Tag color="error">{r.errors.join(' ')}</Tag>,
    },
  ];

  return (
    <Modal
      title={`Bulk upload — ${displayName}`}
      open={open}
      onCancel={() => { reset(); onClose(); }}
      width={800}
      footer={[
        <Button key="cancel" onClick={() => { reset(); onClose(); }}>Cancel</Button>,
        <Button
          key="import"
          type="primary"
          disabled={validRows.length === 0}
          loading={importing}
          onClick={handleImport}
        >
          Import {validRows.length} valid row{validRows.length === 1 ? '' : 's'}
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <Button icon={<DownloadOutlined />} onClick={() => downloadUploadTemplate(tableName, columns)}>
          Download template
        </Button>

        <Upload.Dragger
          accept=".xlsx"
          multiple={false}
          showUploadList={false}
          beforeUpload={handleFile}
        >
          <p className="ant-upload-drag-icon"><InboxOutlined /></p>
          <p>{fileName ?? 'Click or drag a filled-in .xlsx here'}</p>
        </Upload.Dragger>

        {rows.length > 0 && (
          <>
            <Space>
              <Tag color="success">{validRows.length} valid</Tag>
              {invalidRows.length > 0 && <Tag color="error">{invalidRows.length} with errors</Tag>}
            </Space>
            <Table
              size="small"
              rowKey="rowNumber"
              dataSource={rows}
              columns={previewColumns}
              pagination={{ pageSize: 10 }}
              scroll={{ x: true }}
            />
          </>
        )}
      </Space>
    </Modal>
  );
}
