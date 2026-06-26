import { useMemo, useState } from 'react';
import {
  Button,
  Space,
  Table as AntTable,
  Tag,
  Popconfirm,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  DatePicker,
  Empty,
  Spin,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { RegistryEntry, ColumnMetadata, ReferenceDataRow } from '@models/referenceData';
import { useTableMetadata, useTableRows, useSaveRow, useDeleteRow } from './hooks';

interface Props {
  table: RegistryEntry;
}

/** Renders the right input control for a column purely from its metadata
 *  kind — this is the mechanism that lets one component cover every Tier 2
 *  table instead of hand-writing a form per table. */
function fieldControl(col: ColumnMetadata) {
  switch (col.kind) {
    case 'boolean':
      return <Switch />;
    case 'number':
    case 'foreign_key':
      // FK columns render as a plain numeric id input in v1 — resolving a
      // human-readable label requires either a label-column convention in
      // the metadata contract or a dedicated lookup endpoint, neither of
      // which exists yet. Flagged here rather than silently faked.
      return <InputNumber style={{ width: '100%' }} />;
    case 'date':
      return <DatePicker style={{ width: '100%' }} />;
    case 'enum':
      return <Select options={(col.enumValues ?? []).map((v) => ({ label: v, value: v }))} />;
    default:
      return <Input maxLength={col.maxLength ?? undefined} />;
  }
}

export function ReferenceDataTable({ table }: Props) {
  const { data: metadata, isLoading: loadingMeta } = useTableMetadata(table.tableName);
  const { data: rows, isLoading: loadingRows } = useTableRows(table.tableName);
  const saveRow = useSaveRow(table.tableName);
  const deleteRow = useDeleteRow(table.tableName);

  const [form] = Form.useForm();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const editableColumns = useMemo(
    () =>
      (metadata?.columns ?? []).filter(
        (c) =>
          !c.isPrimaryKey &&
          !['created_at', 'created_by', 'updated_at', 'updated_by'].includes(c.name),
      ),
    [metadata],
  );

  if (loadingMeta) return <Spin />;
  if (!metadata) {
    return <Alert type="error" message="Could not load table metadata." showIcon />;
  }

  const pk = metadata.primaryKeyColumn;

  function openAdd() {
    setEditingId(null);
    form.resetFields();
    setModalOpen(true);
  }

  function openEdit(row: ReferenceDataRow) {
    setEditingId(row[pk] as number);
    const values: Record<string, unknown> = { ...row };
    // Dates arrive as ISO strings from the API but DatePicker needs dayjs objects
    for (const col of editableColumns) {
      if (col.kind === 'date' && typeof values[col.name] === 'string') {
        values[col.name] = dayjs(values[col.name] as string);
      }
    }
    form.setFieldsValue(values);
    setModalOpen(true);
  }

  async function handleSave() {
    const values = await form.validateFields();
    const payload: ReferenceDataRow = { ...values };
    for (const col of editableColumns) {
      const v = payload[col.name];
      if (col.kind === 'date' && v && typeof v === 'object' && 'format' in v) {
        payload[col.name] = (v as dayjs.Dayjs).format('YYYY-MM-DD');
      }
    }
    await saveRow.mutateAsync({ id: editingId, row: payload });
    setModalOpen(false);
  }

  const columns: ColumnsType<ReferenceDataRow> = [
    ...editableColumns.slice(0, 6).map((col) => ({
      title: col.label,
      dataIndex: col.name,
      key: col.name,
      render: (value: string | number | boolean | null) => {
        if (col.kind === 'boolean')
          return <Tag color={value ? 'success' : 'default'}>{value ? 'Yes' : 'No'}</Tag>;
        if (value === null || value === undefined || value === '') return '—';
        return String(value);
      },
    })),
    {
      title: '',
      key: '_actions',
      width: 90,
      render: (_, row) => (
        <Space size={4}>
          {table.allowEdit && (
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEdit(row)}
            />
          )}
          {table.allowDelete && (
            <Popconfirm
              title="Delete this row?"
              onConfirm={() => deleteRow.mutate(row[pk] as number)}
            >
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      {table.allowCreate && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>
            Add {table.displayName.replace(/s$/, '')}
          </Button>
        </div>
      )}
      <AntTable<ReferenceDataRow>
        size="small"
        rowKey={pk}
        dataSource={rows ?? []}
        columns={columns}
        loading={loadingRows}
        pagination={{ pageSize: 20 }}
        locale={{ emptyText: <Empty description="No rows yet" /> }}
      />
      <Modal
        title={editingId === null ? `New ${table.displayName.replace(/s$/, '')}` : `Edit row`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSave}
        confirmLoading={saveRow.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          {editableColumns.map((col) => (
            <Form.Item
              key={col.name}
              name={col.name}
              label={col.label}
              valuePropName={col.kind === 'boolean' ? 'checked' : 'value'}
              rules={[{ required: !col.nullable, message: `${col.label} is required` }]}
            >
              {fieldControl(col)}
            </Form.Item>
          ))}
        </Form>
      </Modal>
    </div>
  );
}
