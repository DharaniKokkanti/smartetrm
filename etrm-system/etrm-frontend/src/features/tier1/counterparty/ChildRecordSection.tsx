import { useState, type ReactNode } from 'react';
import { Button, Table, Modal, Form, Space, Tag, Popconfirm, Empty } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

interface ChildRecordSectionProps<T extends { _localId: string; isPrimary: boolean; isActive: boolean }> {
  title: string;
  addLabel: string;
  items: T[];
  onChange: (items: T[]) => void;
  displayColumns: ColumnsType<T>;
  /** Form fields rendered inside the add/edit modal. Receives nothing — the
   *  surrounding <Form> instance handles values via Form.Item name props. */
  renderFormFields: () => ReactNode;
  emptyItem: () => T;
  /** Name of this record's own server-id field (e.g. 'taxRegId',
   *  'bankAccountId') — null means never saved. Must be the record's own
   *  primary key, not a foreign reference like entityId/currencyId, both of
   *  which are always non-null and would otherwise false-positive here. */
  idField: keyof T & string;
}

/**
 * One generic component handles add/edit/remove for ANY polymorphic child
 * record type (contact, bank_account, address — and whatever future
 * entities reuse the same entity_type/entity_id pattern). Child records are
 * staged here in local state via the parent form's `items`/`onChange` —
 * nothing hits the API until the parent form's overall Save, which is what
 * makes "add a contact" feel immediate without a network round-trip per row.
 *
 * Soft-remove only: records that already have a server id (edited from an
 * existing counterparty) are flagged isActive=false rather than spliced out,
 * so the eventual PUT persists the deactivation — matching the soft-delete
 * convention used everywhere else in this schema. Records that were never
 * saved (no id yet) are simply removed from the array, since there's
 * nothing server-side to deactivate.
 */
export function ChildRecordSection<
  T extends { _localId: string; isPrimary: boolean; isActive: boolean },
>({ title, addLabel, items, onChange, displayColumns, renderFormFields, emptyItem, idField }: ChildRecordSectionProps<T>) {
  const [form] = Form.useForm<T>();
  const [editing, setEditing] = useState<T | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const visibleItems = items.filter((i) => i.isActive);

  function openAdd() {
    const fresh = emptyItem();
    setEditing(fresh);
    form.setFieldsValue(fresh as unknown as Parameters<typeof form.setFieldsValue>[0]);
    setModalOpen(true);
  }

  function openEdit(item: T) {
    setEditing(item);
    form.setFieldsValue(item as unknown as Parameters<typeof form.setFieldsValue>[0]);
    setModalOpen(true);
  }

  function handleRemove(item: T) {
    const hasServerId = item[idField] != null;
    if (hasServerId) {
      onChange(items.map((i) => (i._localId === item._localId ? { ...i, isActive: false } : i)));
    } else {
      onChange(items.filter((i) => i._localId !== item._localId));
    }
  }

  async function handleModalSave() {
    const values = await form.validateFields();
    const merged = { ...editing, ...values } as T;
    const exists = items.some((i) => i._localId === merged._localId);
    onChange(exists ? items.map((i) => (i._localId === merged._localId ? merged : i)) : [...items, merged]);
    setModalOpen(false);
  }

  const columns: ColumnsType<T> = [
    ...displayColumns,
    {
      title: '',
      key: '_actions',
      width: 90,
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title={`Remove this ${title.toLowerCase().replace(/s$/, '')}?`} onConfirm={() => handleRemove(record)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 12, justifyContent: 'space-between', width: '100%' }}>
        <span />
        <Button icon={<PlusOutlined />} onClick={openAdd}>
          {addLabel}
        </Button>
      </Space>
      <Table<T>
        size="small"
        rowKey="_localId"
        dataSource={visibleItems}
        columns={columns}
        pagination={false}
        locale={{ emptyText: <Empty description={`No ${title.toLowerCase()} added yet`} /> }}
      />

      <Modal mask={false} forceRender
        title={editing && items.some((i) => i._localId === editing._localId) ? `Edit ${title}` : `Add ${title}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleModalSave}
        okText="Done"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          {renderFormFields()}
        </Form>
      </Modal>
    </div>
  );
}

/** Small reusable "Primary" tag for display columns across all three child types. */
export function PrimaryTag({ isPrimary }: { isPrimary: boolean }) {
  return isPrimary ? <Tag color="blue">Primary</Tag> : null;
}
