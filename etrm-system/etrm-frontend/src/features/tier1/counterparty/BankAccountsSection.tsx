import { Form, Input, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChildRecordSection, PrimaryTag } from './ChildRecordSection';
import type { BankAccount } from './types';
import { CURRENCY_LOOKUP } from './staticLookups';
import { localId } from '@utils/localId';
import { useCustomConfigOptions } from './configLookups';
const CURRENCY_OPTIONS = CURRENCY_LOOKUP.map((c) => ({
  label: `${c.currencyCode} — ${c.currencyName}`,
  value: c.currencyId,
}));

interface Props {
  items: BankAccount[];
  onChange: (items: BankAccount[]) => void;
}

export function BankAccountsSection({ items, onChange }: Props) {
  const { data: typeOptions = [], isLoading } = useCustomConfigOptions('BANK_ACCOUNT_TYPE');
  const columns: ColumnsType<BankAccount> = [
    { title: 'Account Name', dataIndex: 'accountName' },
    { title: 'Bank', dataIndex: 'bankName' },
    { title: 'Type', dataIndex: 'accountType', width: 110 },
    { title: 'SWIFT/BIC', dataIndex: 'swiftBic', width: 110, render: (v) => v || '—' },
    { title: 'IBAN', dataIndex: 'iban', render: (v) => v || '—' },
    { title: '', key: 'primary', width: 80, render: (_, r) => <PrimaryTag isPrimary={r.isPrimary} /> },
  ];

  return (
    <ChildRecordSection<BankAccount>
      title="Bank Accounts"
      addLabel="Add Bank Account"
      items={items}
      onChange={onChange}
      displayColumns={columns}
      emptyItem={() => ({
        bankAccountId: null,
        _localId: localId(),
        entityType: 'COUNTERPARTY',
        entityId: 0,
        accountType: 'SETTLEMENT',
        currencyId: CURRENCY_LOOKUP[0].currencyId,
        isPrimary: items.length === 0,
        bankName: '',
        bankCode: null,
        swiftBic: null,
        iban: null,
        accountNumber: null,
        accountName: '',
        correspondentSwift: null,
        correspondentName: null,
        isActive: true,
        notes: null,
      })}
      renderFormFields={() => (
        <>
          <Form.Item name="accountType" label="Account Type" rules={[{ required: true }]}>
            <Select options={typeOptions} loading={isLoading} />
          </Form.Item>
          <Form.Item name="currencyId" label="Currency" rules={[{ required: true }]}>
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>
          <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
            <Input placeholder="Name on the account" />
          </Form.Item>
          <Form.Item name="bankName" label="Bank Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="swiftBic" label="SWIFT/BIC">
            <Input maxLength={11} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="iban" label="IBAN">
            <Input maxLength={34} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="accountNumber" label="Account Number">
            <Input />
          </Form.Item>
          <Form.Item name="isPrimary" label="Primary Account" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  );
}
