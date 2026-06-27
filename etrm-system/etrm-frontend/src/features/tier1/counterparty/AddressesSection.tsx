import { Form, Input, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChildRecordSection, PrimaryTag } from './ChildRecordSection';
import type { Address } from './types';
import { localId } from '@utils/localId';
import { useCustomConfigOptions } from './configLookups';

interface Props {
  items: Address[];
  onChange: (items: Address[]) => void;
}

export function AddressesSection({ items, onChange }: Props) {
  const { data: typeOptions = [], isLoading } = useCustomConfigOptions('ADDRESS_TYPE');
  const columns: ColumnsType<Address> = [
    { title: 'Type', dataIndex: 'addressType', width: 110 },
    {
      title: 'Address',
      key: 'address',
      render: (_, r) => [r.addressLine1, r.city, r.countryCode].filter(Boolean).join(', '),
    },
    { title: 'Postal Code', dataIndex: 'postalCode', width: 110, render: (v) => v || '—' },
    { title: '', key: 'primary', width: 80, render: (_, r) => <PrimaryTag isPrimary={r.isPrimary} /> },
  ];

  return (
    <ChildRecordSection<Address>
      title="Addresses"
      addLabel="Add Address"
      items={items}
      onChange={onChange}
      displayColumns={columns}
      emptyItem={() => ({
        addressId: null,
        _localId: localId(),
        entityType: 'COUNTERPARTY',
        entityId: 0,
        addressType: 'REGISTERED',
        isPrimary: items.length === 0,
        addressLine1: '',
        addressLine2: null,
        addressLine3: null,
        city: '',
        stateProvince: null,
        postalCode: null,
        countryCode: '',
        poBox: null,
        isActive: true,
        notes: null,
      })}
      renderFormFields={() => (
        <>
          <Form.Item name="addressType" label="Address Type" rules={[{ required: true }]}>
            <Select options={typeOptions} loading={isLoading} />
          </Form.Item>
          <Form.Item name="addressLine1" label="Address Line 1" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="addressLine2" label="Address Line 2">
            <Input />
          </Form.Item>
          <Form.Item name="city" label="City" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="stateProvince" label="State / Province">
            <Input />
          </Form.Item>
          <Form.Item name="postalCode" label="Postal Code">
            <Input />
          </Form.Item>
          <Form.Item
            name="countryCode"
            label="Country (ISO 2)"
            rules={[{ required: true }, { len: 2, message: '2-letter code' }]}
          >
            <Input maxLength={2} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="isPrimary" label="Primary Address" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  );
}
