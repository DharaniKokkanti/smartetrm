import { useMemo } from 'react';
import { Modal, Tabs, Table, Tag, Typography, Alert } from 'antd';
import { App as AntApp } from 'antd';
import type { LegalEntityUploadRow } from './types';
import { useBulkCreateLegalEntities } from './hooks';

interface Props {
  open: boolean;
  rows: LegalEntityUploadRow[];
  onClose: () => void;
}

export function LegalEntityUploadReviewModal({ open, rows, onClose }: Props) {
  const { message } = AntApp.useApp();
  const bulkCreate = useBulkCreateLegalEntities();

  const { validRows, invalidRows } = useMemo(() => {
    const validRows = rows.filter((r) => r._errors.length === 0);
    const invalidRows = rows.filter((r) => r._errors.length > 0);
    return { validRows, invalidRows };
  }, [rows]);

  async function handleConfirm() {
    if (validRows.length === 0) {
      onClose();
      return;
    }
    const inputs = validRows.map(({ _rowNumber: _rn, _errors: _e, ...rest }) => rest);
    const result = await bulkCreate.mutateAsync(inputs);
    message.success(
      `Imported ${result.created.length} legal entit${result.created.length === 1 ? 'y' : 'ies'}.` +
        (result.rejected.length ? ` ${result.rejected.length} rejected by server.` : ''),
    );
    onClose();
  }

  return (
    <Modal mask={false} forceRender
      title="Review Upload"
      open={open}
      onCancel={onClose}
      onOk={handleConfirm}
      okText={`Import ${validRows.length} row${validRows.length === 1 ? '' : 's'}`}
      okButtonProps={{ disabled: validRows.length === 0, loading: bulkCreate.isPending }}
      width={760}
    >
      <Alert
        type={invalidRows.length ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 16 }}
        message={
          invalidRows.length
            ? `${validRows.length} row(s) ready to import, ${invalidRows.length} row(s) rejected — fix and re-upload rejected rows separately.`
            : `All ${validRows.length} row(s) passed validation.`
        }
      />
      <Tabs
        items={[
          {
            key: 'valid',
            label: `Ready to import (${validRows.length})`,
            children: (
              <Table
                size="small"
                rowKey="_rowNumber"
                dataSource={validRows}
                pagination={false}
                scroll={{ y: 320 }}
                columns={[
                  { title: 'Row', dataIndex: '_rowNumber', width: 60 },
                  { title: 'Code', dataIndex: 'entityCode' },
                  { title: 'Name', dataIndex: 'entityName' },
                  { title: 'Type', dataIndex: 'entityType' },
                  { title: 'Jurisdiction', dataIndex: 'jurisdiction' },
                  { title: 'Currency', dataIndex: 'baseCurrency' },
                ]}
              />
            ),
          },
          {
            key: 'invalid',
            label: `Rejected (${invalidRows.length})`,
            children: (
              <Table
                size="small"
                rowKey="_rowNumber"
                dataSource={invalidRows}
                pagination={false}
                scroll={{ y: 320 }}
                columns={[
                  { title: 'Row', dataIndex: '_rowNumber', width: 60 },
                  { title: 'Code', dataIndex: 'entityCode' },
                  { title: 'Name', dataIndex: 'entityName' },
                  {
                    title: 'Errors',
                    dataIndex: '_errors',
                    render: (errors: string[]) => (
                      <>
                        {errors.map((e, i) => (
                          <Tag color="error" key={i} style={{ marginBottom: 4 }}>
                            <Typography.Text style={{ fontSize: 12 }}>{e}</Typography.Text>
                          </Tag>
                        ))}
                      </>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </Modal>
  );
}
