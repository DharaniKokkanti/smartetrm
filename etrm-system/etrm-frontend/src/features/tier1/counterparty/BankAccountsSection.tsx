import { Form, Input, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChildRecordSection, PrimaryTag } from './ChildRecordSection';
import type { BankAccount } from './types';
import { localId } from '@utils/localId';
import { useCustomConfigOptions } from './configLookups';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { hint } from '@components/smart/FieldHint';

interface Props {
  items: BankAccount[];
  onChange: (items: BankAccount[]) => void;
}

export function BankAccountsSection({ items, onChange }: Props) {
  const { data: typeOptions = [], isLoading } = useCustomConfigOptions('BANK_ACCOUNT_TYPE');
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const currencyOptions = currencies
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.currencyCode} — ${c.currencyName}`, value: c.currencyId }));
  const columns: ColumnsType<BankAccount> = [
    { title: 'Account Name', dataIndex: 'accountName' },
    { title: 'Bank', dataIndex: 'bankName' },
    { title: 'Type', dataIndex: 'accountType', width: 110, render: (v: number) => typeOptions.find((o) => o.value === v)?.label ?? '—' },
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
      idField="bankAccountId"
      emptyItem={() => ({
        bankAccountId: null,
        _localId: localId(),
        entityType: 'COUNTERPARTY',
        entityId: 0,
        accountType: typeOptions.find((o) => o.label === 'Settlement')?.value ?? 0,
        currencyId: currencies[0]?.currencyId ?? 0,
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
          <Form.Item
            name="accountType"
            label={hint('Account Type', 'SETTLEMENT = used for trade payments/receipts. COLLATERAL = margin/CSA postings. FEE = broker/service fee payments.')}
            rules={[{ required: true }]}
          >
            <Select options={typeOptions} loading={isLoading} />
          </Form.Item>
          <Form.Item name="currencyId" label="Currency" rules={[{ required: true }]}>
            <Select options={currencyOptions} loading={loadingCurrencies} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="accountName" label="Account Name" rules={[{ required: true }]}>
            <Input placeholder="Name on the account" />
          </Form.Item>
          <Form.Item name="bankName" label="Bank Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="swiftBic"
            label={hint('SWIFT/BIC', 'Bank Identifier Code (ISO 9362) used to route international wires to this account.', 'DEUTDEFF')}
          >
            <Input maxLength={11} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item
            name="iban"
            label={hint('IBAN', 'International Bank Account Number — required for SEPA/EU wires; leave blank for jurisdictions that use a local account number instead.', 'DE89370400440532013000')}
          >
            <Input maxLength={34} style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="accountNumber" label="Account Number">
            <Input />
          </Form.Item>
          <Form.Item
            name="isPrimary"
            label={hint('Primary Account', 'The default account used for this account type when generating settlement/payment instructions.')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </>
      )}
    />
  );
}
