import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Switch, Button, Space } from 'antd';
import type { BankAccount } from '@features/tier1/counterparty/types';
import { useSaveBankAccount } from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { useDraftValues } from '@components/smart/formDraft';
import { hint } from '@components/smart/FieldHint';
import { localId } from '@utils/localId';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: BankAccount | null;
}

/** Standalone create/edit drawer for one bank account, used by the
 *  cross-entity Bank Accounts Directory page. BankAccountsSection.tsx (via
 *  ChildRecordSection) edits a staged items[] array saved only when the
 *  parent Counterparty form is saved — doesn't fit a directory page with
 *  its own per-record save. Saves through the existing
 *  counterpartyApi.bankAccounts create/update calls (via useSaveBankAccount),
 *  the same ones BankAccountsSection ultimately persists through, so the
 *  wire shape and mock endpoints are unchanged.
 *
 *  Bank accounts are counterparty-owned only — the real
 *  `/counterparties/:id/bank-accounts` route (and LegalEntityFormDrawer,
 *  which has no BankAccountsSection tab at all) confirm legal entities don't
 *  hold bank accounts in this app, so unlike the Contact/Tax drawers there's
 *  no entity-type picker, just a counterparty picker. */
export function BankAccountDrawer({ open, onClose, editing }: Props) {
  const [form] = Form.useForm<Omit<BankAccount, 'bankAccountId' | '_localId' | 'entityType' | 'entityId'> & { entityId: number }>();
  const skipDraftReset = useDraftValues('bank-account-v', form, open, editing);
  const saveAccount = useSaveBankAccount();
  const { data: typeOptions = [], isLoading } = useCustomConfigOptions('BANK_ACCOUNT_TYPE');
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const { data: counterparties = [] } = useCounterparties();

  const currencyOptions = currencies
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.currencyCode} — ${c.currencyName}`, value: c.currencyId }));
  const counterpartyOptions = counterparties.map((c) => ({ label: `${c.cpCode} — ${c.legalName}`, value: c.counterpartyId }));

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/immutability -- skipDraftReset is a useRef() from useDraftValues; the compiler cannot see refs through a custom hook boundary
    if (skipDraftReset.current) { skipDraftReset.current = false; return; }
    if (editing) {
      form.setFieldsValue({ ...editing, entityId: editing.entityId });
    } else {
      form.resetFields();
      form.setFieldsValue({ isPrimary: false } as Partial<BankAccount>);
    }
  }, [open, editing, form]);

  async function handleSubmit() {
    const values = await form.validateFields();
    const account: BankAccount = {
      bankAccountId: editing?.bankAccountId ?? null,
      _localId: editing?._localId ?? localId(),
      entityType: 'COUNTERPARTY',
      entityId: values.entityId,
      accountType: values.accountType,
      currencyId: values.currencyId,
      isPrimary: values.isPrimary,
      bankName: values.bankName,
      bankCode: values.bankCode ?? null,
      swiftBic: values.swiftBic ?? null,
      iban: values.iban ?? null,
      accountNumber: values.accountNumber ?? null,
      accountName: values.accountName,
      correspondentSwift: values.correspondentSwift ?? null,
      correspondentName: values.correspondentName ?? null,
      isActive: true,
      notes: values.notes ?? null,
    };
    await saveAccount.mutateAsync({ entityId: values.entityId, account });
    onClose();
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit Bank Account — ${editing.accountName}` : 'New Bank Account'}
      width={460}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={saveAccount.isPending}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="entityId"
          label={hint('Counterparty', 'Which counterparty this bank account belongs to.')}
          rules={[{ required: true, message: 'Select a counterparty' }]}
        >
          <Select
            options={counterpartyOptions}
            showSearch
            optionFilterProp="label"
            placeholder="Select counterparty"
          />
        </Form.Item>

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
          label={hint('IBAN', 'International Bank Account Number — required for SEPA/EU wires.', 'DE89370400440532013000')}
        >
          <Input maxLength={34} style={{ textTransform: 'uppercase' }} />
        </Form.Item>
        <Form.Item name="accountNumber" label="Account Number">
          <Input />
        </Form.Item>
        <Form.Item name="isPrimary" label="Primary Account" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} maxLength={1000} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
