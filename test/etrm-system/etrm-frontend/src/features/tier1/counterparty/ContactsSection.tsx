import { Form, Input, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChildRecordSection, PrimaryTag } from './ChildRecordSection';
import { CONTACT_ROLES, type Contact } from './types';
import { localId } from '@utils/localId';

const ROLE_OPTIONS = CONTACT_ROLES.map((r) => ({ label: r.replaceAll('_', ' '), value: r }));

interface Props {
  items: Contact[];
  onChange: (items: Contact[]) => void;
}

export function ContactsSection({ items, onChange }: Props) {
  const columns: ColumnsType<Contact> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, r) => `${r.firstName} ${r.lastName}`,
    },
    { title: 'Role', dataIndex: 'contactRole', width: 130 },
    { title: 'Job Title', dataIndex: 'jobTitle', ellipsis: true },
    { title: 'Email', dataIndex: 'email' },
    {
      title: '',
      key: 'primary',
      width: 80,
      render: (_, r) => <PrimaryTag isPrimary={r.isPrimary} />,
    },
  ];

  return (
    <ChildRecordSection<Contact>
      title="Contacts"
      addLabel="Add Contact"
      items={items}
      onChange={onChange}
      displayColumns={columns}
      emptyItem={() => ({
        contactId: null,
        _localId: localId(),
        entityType: 'COUNTERPARTY',
        entityId: 0,
        contactRole: 'PRIMARY',
        salutation: null,
        firstName: '',
        lastName: '',
        jobTitle: null,
        email: null,
        phoneDirect: null,
        phoneMobile: null,
        phoneMain: null,
        isPrimary: items.length === 0,
        isActive: true,
        notes: null,
      })}
      renderFormFields={() => (
        <>
          <Form.Item name="contactRole" label="Role" rules={[{ required: true }]}>
            <Select options={ROLE_OPTIONS} />
          </Form.Item>
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
          <Form.Item name="phoneDirect" label="Direct Phone">
            <Input />
          </Form.Item>
          <Form.Item name="phoneMobile" label="Mobile Phone">
            <Input />
          </Form.Item>
          <Form.Item name="isPrimary" label="Primary Contact" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  );
}
