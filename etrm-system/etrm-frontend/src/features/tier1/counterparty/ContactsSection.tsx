import { useState } from 'react';
import {
  Button, Form, Input, Modal, Popconfirm, Select, Space,
  Switch, Table, Tag, Empty, Segmented,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PrimaryTag } from './ChildRecordSection';
import type { Contact, ContactAssignment, PolymorphicEntityType } from './types';
import { localId } from '@utils/localId';
import { useCustomConfigOptions } from './configLookups';
import { useContactPool } from './hooks';

interface Props {
  items: ContactAssignment[];
  onChange: (items: ContactAssignment[]) => void;
  entityType?: PolymorphicEntityType;
}

export function ContactsSection({ items, onChange, entityType = 'COUNTERPARTY' }: Props) {
  const { data: roleOptions = [], isLoading: loadingRoles } = useCustomConfigOptions('CONTACT_ROLE');
  const { data: pool = [] } = useContactPool();

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'new' | 'link'>('new');
  const [editing, setEditing] = useState<ContactAssignment | null>(null);
  const [form] = Form.useForm();
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);

  const visible = items.filter((c) => c.isActive);

  const columns: ColumnsType<ContactAssignment> = [
    {
      title: 'Name', key: 'name',
      render: (_, r) => (
        <Space size={4}>
          {r.contact.firstName} {r.contact.lastName}
          {r.isLinked && <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>Linked</Tag>}
        </Space>
      ),
    },
    { title: 'Role', dataIndex: 'contactRole', width: 130 },
    { title: 'Job Title', dataIndex: ['contact', 'jobTitle'], ellipsis: true },
    { title: 'Email', dataIndex: ['contact', 'email'], ellipsis: true },
    {
      title: 'Phone', key: 'phone', width: 140,
      render: (_, r) => r.contact.phoneMobile || r.contact.phoneDirect || r.contact.phoneMain || '—',
    },
    { title: '', key: 'primary', width: 70, render: (_, r) => <PrimaryTag isPrimary={r.isPrimary} /> },
    {
      title: '', key: '_actions', width: 80,
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Remove this contact?" onConfirm={() => handleRemove(record)}>
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  function openAdd() {
    setEditing(null);
    setMode('new');
    setSelectedPoolId(null);
    form.resetFields();
    form.setFieldsValue({ contactRole: 'PRIMARY', isPrimary: visible.length === 0 });
    setModalOpen(true);
  }

  function openEdit(item: ContactAssignment) {
    setEditing(item);
    setMode(item.isLinked ? 'link' : 'new');
    setSelectedPoolId(item.isLinked ? (item.contactId ?? null) : null);
    form.setFieldsValue({
      contactRole: item.contactRole,
      isPrimary: item.isPrimary,
      ...item.contact,
    });
    setModalOpen(true);
  }

  function handleRemove(item: ContactAssignment) {
    if (item.entityContactId !== null) {
      onChange(items.map((i) => i._localId === item._localId ? { ...i, isActive: false } : i));
    } else {
      onChange(items.filter((i) => i._localId !== item._localId));
    }
  }

  async function handleOk() {
    const values = await form.validateFields();

    if (mode === 'link') {
      if (!selectedPoolId) return;
      const poolContact = pool.find((c) => c.contactId === selectedPoolId)!;
      const assignment: ContactAssignment = {
        entityContactId: editing?.entityContactId ?? null,
        _localId: editing?._localId ?? localId(),
        entityType,
        entityId: 0,
        contactId: poolContact.contactId,
        contact: poolContact,
        contactRole: values.contactRole as string,
        isPrimary: values.isPrimary as boolean,
        isActive: true,
        isLinked: true,
      };
      onChange(
        editing
          ? items.map((i) => i._localId === editing._localId ? assignment : i)
          : [...items, assignment],
      );
    } else {
      const contact: Contact = {
        contactId: editing?.isLinked ? null : (editing?.contact.contactId ?? null),
        _localId: editing?.contact._localId ?? localId(),
        salutation: null,
        firstName: values.firstName as string,
        lastName: values.lastName as string,
        jobTitle: values.jobTitle as string | null ?? null,
        email: values.email as string | null ?? null,
        phoneMobile: values.phoneMobile as string | null ?? null,
        phoneDirect: values.phoneDirect as string | null ?? null,
        phoneMain: values.phoneMain as string | null ?? null,
        isActive: true,
        notes: null,
      };
      const assignment: ContactAssignment = {
        entityContactId: editing?.isLinked ? null : (editing?.entityContactId ?? null),
        _localId: editing?.isLinked ? localId() : (editing?._localId ?? localId()),
        entityType,
        entityId: 0,
        contactId: contact.contactId,
        contact,
        contactRole: values.contactRole as string,
        isPrimary: values.isPrimary as boolean,
        isActive: true,
        isLinked: false,
      };
      onChange(
        editing && !editing.isLinked
          ? items.map((i) => i._localId === editing._localId ? assignment : i)
          : [...items, assignment],
      );
    }
    setModalOpen(false);
  }

  const assignedIds = new Set(items.filter((c) => c.isActive && c.contactId).map((c) => c.contactId));
  const poolOptions = pool
    .filter((c) => c.isActive)
    .map((c) => ({
      value: c.contactId!,
      label: `${c.firstName} ${c.lastName}${c.jobTitle ? ` — ${c.jobTitle}` : ''}`,
      disabled: assignedIds.has(c.contactId!) && selectedPoolId !== c.contactId,
    }));

  return (
    <div>
      <Space style={{ marginBottom: 12, justifyContent: 'flex-end', width: '100%' }}>
        <Button icon={<PlusOutlined />} onClick={openAdd}>Add Contact</Button>
      </Space>

      <Table<ContactAssignment>
        size="small"
        rowKey="_localId"
        dataSource={visible}
        columns={columns}
        pagination={false}
        locale={{ emptyText: <Empty description="No contacts added yet" /> }}
      />

      <Modal mask={false} forceRender
        title={editing ? 'Edit Contact' : 'Add Contact'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        okText="Done"
        destroyOnHidden
        width={520}
      >
        {!editing && (
          <Segmented
            block
            value={mode}
            onChange={(v) => { setMode(v as 'new' | 'link'); form.resetFields(['firstName','lastName','jobTitle','email','phoneMobile','phoneDirect','phoneMain']); setSelectedPoolId(null); }}
            options={[
              { label: 'New Contact', value: 'new' },
              { label: <><LinkOutlined style={{ marginRight: 4 }} />Link Existing</>, value: 'link' },
            ]}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical">
          <Form.Item name="contactRole" label="Role" rules={[{ required: true }]}>
            <Select options={roleOptions} loading={loadingRoles} />
          </Form.Item>

          {mode === 'link' ? (
            <Form.Item label="Select Existing Contact" required>
              <Select
                showSearch
                placeholder="Search by name…"
                optionFilterProp="label"
                value={selectedPoolId}
                onChange={(v) => setSelectedPoolId(v as number)}
                options={poolOptions}
                style={{ width: '100%' }}
              />
              {selectedPoolId && (() => {
                const c = pool.find((x) => x.contactId === selectedPoolId);
                return c ? (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: '#f9f9f9', borderRadius: 4, fontSize: 12, color: '#595959' }}>
                    <strong>{c.firstName} {c.lastName}</strong>{c.jobTitle ? ` — ${c.jobTitle}` : ''}
                    {c.email && <div>{c.email}</div>}
                    {(c.phoneMobile || c.phoneDirect || c.phoneMain) && (
                      <div>{c.phoneMobile || c.phoneDirect || c.phoneMain}</div>
                    )}
                  </div>
                ) : null;
              })()}
            </Form.Item>
          ) : (
            <>
              <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="jobTitle" label="Job Title">
                <Input />
              </Form.Item>
              <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
                <Input />
              </Form.Item>
              <Form.Item name="phoneMobile" label="Mobile">
                <Input placeholder="+44 7700 900000" />
              </Form.Item>
              <Form.Item name="phoneDirect" label="Direct Line">
                <Input placeholder="+44 20 7946 0000" />
              </Form.Item>
              <Form.Item name="phoneMain" label="Main / Reception">
                <Input placeholder="+44 20 7946 0000" />
              </Form.Item>
            </>
          )}

          <Form.Item name="isPrimary" label="Primary Contact" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
