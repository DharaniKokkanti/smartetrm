import { useState } from 'react';
import {
  Button, Form, Input, Modal, Popconfirm, Select, Space,
  Switch, Table, Tag, Empty, Segmented,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { PrimaryTag } from './ChildRecordSection';
import type { Address, AddressAssignment, PolymorphicEntityType } from './types';
import { localId } from '@utils/localId';
import { useCustomConfigOptions } from './configLookups';
import { useCountries } from '@features/reference/countries/hooks';
import { useAddressPool } from './hooks';
import { hint } from '@components/smart/FieldHint';

interface Props {
  items: AddressAssignment[];
  onChange: (items: AddressAssignment[]) => void;
  entityType?: PolymorphicEntityType;
}

export function AddressesSection({ items, onChange, entityType = 'COUNTERPARTY' }: Props) {
  const { data: typeOptions = [], isLoading: loadingTypes } = useCustomConfigOptions('ADDRESS_TYPE');
  const { data: pool = [] } = useAddressPool();
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const countryOptions = countries
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.countryCode} — ${c.countryName}`, value: c.countryId }));
  const countryLabelById = new Map(countries.map((c) => [c.countryId, `${c.countryCode} — ${c.countryName}`]));

  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<'new' | 'link'>('new');
  const [editing, setEditing] = useState<AddressAssignment | null>(null);
  const [form] = Form.useForm();
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);

  const visible = items.filter((a) => a.isActive);

  const columns: ColumnsType<AddressAssignment> = [
    {
      title: 'Type', dataIndex: 'addressType', width: 120,
      render: (v: number, r) => (
        <Space size={4}>
          {typeOptions.find((o) => o.value === v)?.label ?? '—'}
          {r.isLinked && <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>Linked</Tag>}
        </Space>
      ),
    },
    {
      title: 'Address', key: 'address',
      render: (_, r) => [r.address.addressLine1, r.address.city, countryLabelById.get(r.address.countryId) ?? r.address.countryId].filter(Boolean).join(', '),
    },
    { title: 'Postal', dataIndex: ['address', 'postalCode'], width: 100, render: (v) => v || '—' },
    { title: 'Phone', dataIndex: ['address', 'phoneNumber'], width: 140, render: (v) => v || '—' },
    { title: '', key: 'primary', width: 70, render: (_, r) => <PrimaryTag isPrimary={r.isPrimary} /> },
    {
      title: '', key: '_actions', width: 80,
      render: (_, record) => (
        <Space size={4}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Remove this address?" onConfirm={() => handleRemove(record)}>
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
    form.setFieldsValue({
      addressType: typeOptions.find((o) => o.label === 'Registered')?.value,
      isPrimary: visible.length === 0,
    });
    setModalOpen(true);
  }

  function openEdit(item: AddressAssignment) {
    setEditing(item);
    setMode(item.isLinked ? 'link' : 'new');
    setSelectedPoolId(item.isLinked ? (item.addressId ?? null) : null);
    form.setFieldsValue({
      addressType: item.addressType,
      isPrimary: item.isPrimary,
      ...item.address,
    });
    setModalOpen(true);
  }

  function handleRemove(item: AddressAssignment) {
    if (item.entityAddressId !== null) {
      onChange(items.map((i) => i._localId === item._localId ? { ...i, isActive: false } : i));
    } else {
      onChange(items.filter((i) => i._localId !== item._localId));
    }
  }

  async function handleOk() {
    const values = await form.validateFields();

    if (mode === 'link') {
      if (!selectedPoolId) return;
      const poolAddr = pool.find((a) => a.addressId === selectedPoolId)!;
      const assignment: AddressAssignment = {
        entityAddressId: editing?.entityAddressId ?? null,
        _localId: editing?._localId ?? localId(),
        entityType,
        entityId: 0,
        addressId: poolAddr.addressId,
        address: poolAddr,
        addressType: values.addressType as number,
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
      const address: Address = {
        addressId: editing?.isLinked ? null : (editing?.address.addressId ?? null),
        _localId: editing?.address._localId ?? localId(),
        addressLine1: values.addressLine1 as string,
        addressLine2: values.addressLine2 as string | null ?? null,
        addressLine3: null,
        city: values.city as string,
        stateProvince: values.stateProvince as string | null ?? null,
        postalCode: values.postalCode as string | null ?? null,
        countryId: values.countryId as number,
        poBox: null,
        phoneNumber: values.phoneNumber as string | null ?? null,
        isActive: true,
        notes: null,
      };
      const assignment: AddressAssignment = {
        entityAddressId: editing?.isLinked ? null : (editing?.entityAddressId ?? null),
        _localId: editing?.isLinked ? localId() : (editing?._localId ?? localId()),
        entityType,
        entityId: 0,
        addressId: address.addressId,
        address,
        addressType: values.addressType as number,
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

  // pool options excluding addresses already assigned
  const assignedIds = new Set(items.filter((a) => a.isActive && a.addressId).map((a) => a.addressId));
  const poolOptions = pool
    .filter((a) => a.isActive)
    .map((a) => ({
      value: a.addressId!,
      label: `${a.addressLine1}, ${a.city}, ${countryLabelById.get(a.countryId) ?? a.countryId}${a.postalCode ? ` ${a.postalCode}` : ''}`,
      disabled: assignedIds.has(a.addressId!) && selectedPoolId !== a.addressId,
    }));

  return (
    <div>
      <Space style={{ marginBottom: 12, justifyContent: 'flex-end', width: '100%' }}>
        <Button icon={<PlusOutlined />} onClick={openAdd}>Add Address</Button>
      </Space>

      <Table<AddressAssignment>
        size="small"
        rowKey="_localId"
        dataSource={visible}
        columns={columns}
        pagination={false}
        locale={{ emptyText: <Empty description="No addresses added yet" /> }}
      />

      <Modal mask={false} forceRender
        title={editing ? 'Edit Address' : 'Add Address'}
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
            onChange={(v) => { setMode(v as 'new' | 'link'); form.resetFields(['addressLine1','addressLine2','city','stateProvince','postalCode','countryId','phoneNumber']); setSelectedPoolId(null); }}
            options={[
              { label: 'New Address', value: 'new' },
              { label: <><LinkOutlined style={{ marginRight: 4 }} />Link Existing</>, value: 'link' },
            ]}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="addressType"
            label={hint('Address Type', 'REGISTERED = official/legal registered office. Others (e.g. mailing, delivery) are for operational correspondence only — the registered address is what appears on legal documents.')}
            rules={[{ required: true }]}
          >
            <Select options={typeOptions} loading={loadingTypes} />
          </Form.Item>

          {mode === 'link' ? (
            <Form.Item
              label={hint('Select Existing Address', 'Reuses an address already on file (e.g. a group HQ shared by several affiliated counterparties) instead of creating a duplicate record.')}
              required>
              <Select
                showSearch
                placeholder="Search by street, city…"
                optionFilterProp="label"
                value={selectedPoolId}
                onChange={(v) => setSelectedPoolId(v as number)}
                options={poolOptions}
                style={{ width: '100%' }}
              />
              {selectedPoolId && (() => {
                const a = pool.find((x) => x.addressId === selectedPoolId);
                return a ? (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: '#f9f9f9', borderRadius: 4, fontSize: 12, color: '#595959' }}>
                    {[a.addressLine1, a.addressLine2, a.city, a.stateProvince, a.postalCode, countryLabelById.get(a.countryId) ?? a.countryId].filter(Boolean).join(', ')}
                    {a.phoneNumber && <div style={{ marginTop: 2 }}>{a.phoneNumber}</div>}
                  </div>
                ) : null;
              })()}
            </Form.Item>
          ) : (
            <>
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
              <Form.Item name="countryId" label="Country" rules={[{ required: true }]}>
                <Select options={countryOptions} loading={loadingCountries} showSearch optionFilterProp="label" placeholder="Select country" />
              </Form.Item>
              <Form.Item name="phoneNumber" label="Phone Number">
                <Input placeholder="+1 212 555 0100" />
              </Form.Item>
            </>
          )}

          <Form.Item
            name="isPrimary"
            label={hint('Primary Address', 'The default address shown when only one can be surfaced for this entity, e.g. on a statement or shipping document.')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
