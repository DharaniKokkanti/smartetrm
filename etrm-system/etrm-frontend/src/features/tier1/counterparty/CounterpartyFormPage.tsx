import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Tabs,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  InputNumber,
  Button,
  Space,
  Spin,
  Badge,
} from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import {
  CP_TYPES,
  KYC_STATUSES,
  type Address,
  type BankAccount,
  type Contact,
  type CounterpartyInput,
} from './types';
import { CURRENCY_LOOKUP, CREDIT_RATING_LOOKUP } from './staticLookups';
import { useCounterparty, useCounterpartyChildren, useSaveCounterpartyDraft } from './hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { ContactsSection } from './ContactsSection';
import { BankAccountsSection } from './BankAccountsSection';
import { AddressesSection } from './AddressesSection';
import { EntityGuaranteesPanel } from '@features/tier1/guarantee/EntityGuaranteesPanel';

const CP_TYPE_OPTIONS = CP_TYPES.map((t) => ({ label: t, value: t }));
const KYC_OPTIONS = KYC_STATUSES.map((s) => ({ label: s, value: s }));
const CURRENCY_OPTIONS = CURRENCY_LOOKUP.map((c) => ({
  label: c.currencyCode,
  value: c.currencyId,
}));
const RATING_OPTIONS = CREDIT_RATING_LOOKUP.map((r) => ({
  label: `${r.agency} ${r.rating}`,
  value: r.creditRatingId,
}));

type CoreFormValues = Omit<
  CounterpartyInput,
  'creditReviewDate' | 'kycApprovedDate' | 'kycExpiryDate' | 'onboardedDate'
> & {
  creditReviewDate?: dayjs.Dayjs;
  kycApprovedDate?: dayjs.Dayjs;
  kycExpiryDate?: dayjs.Dayjs;
  onboardedDate?: dayjs.Dayjs;
};

export function CounterpartyFormPage() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const isNew = !idParam || idParam === 'new';
  const cpId = isNew ? null : Number(idParam);

  const [coreForm] = Form.useForm<CoreFormValues>();
  const { data: existing, isLoading: loadingCore } = useCounterparty(cpId);
  const { data: existingChildren, isLoading: loadingChildren } = useCounterpartyChildren(cpId);
  const { data: legalEntities } = useLegalEntities();
  const saveDraft = useSaveCounterpartyDraft();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  useEffect(() => {
    if (existing) {
      coreForm.setFieldsValue({
        ...existing,
        creditReviewDate: existing.creditReviewDate ? dayjs(existing.creditReviewDate) : undefined,
        kycApprovedDate: existing.kycApprovedDate ? dayjs(existing.kycApprovedDate) : undefined,
        kycExpiryDate: existing.kycExpiryDate ? dayjs(existing.kycExpiryDate) : undefined,
        onboardedDate: existing.onboardedDate ? dayjs(existing.onboardedDate) : undefined,
      });
    }
  }, [existing, coreForm]);

  useEffect(() => {
    // Deliberate: this seeds locally-mutable draft state (contacts/bankAccounts/
    // addresses can be added/edited/removed client-side before the overall
    // Save) from async server data that only exists once. This isn't
    // derivable during render — it's a one-time hydration of editable local
    // state when the query resolves, not a value that should stay in sync
    // with the query on every render.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (existingChildren) {
      setContacts(
        existingChildren.contacts.map((c) => ({ ...c, _localId: `srv-c-${c.contactId}` })),
      );
      setBankAccounts(
        existingChildren.bankAccounts.map((b) => ({ ...b, _localId: `srv-b-${b.bankAccountId}` })),
      );
      setAddresses(
        existingChildren.addresses.map((a) => ({ ...a, _localId: `srv-a-${a.addressId}` })),
      );
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [existingChildren]);

  const legalEntityOptions = useMemo(
    () =>
      (legalEntities ?? []).map((e) => ({
        label: `${e.entityCode} — ${e.entityName}`,
        value: e.legalEntityId,
      })),
    [legalEntities],
  );

  async function handleSave() {
    const values = await coreForm.validateFields();
    const core: CounterpartyInput = {
      ...values,
      creditReviewDate: values.creditReviewDate
        ? values.creditReviewDate.format('YYYY-MM-DD')
        : null,
      kycApprovedDate: values.kycApprovedDate ? values.kycApprovedDate.format('YYYY-MM-DD') : null,
      kycExpiryDate: values.kycExpiryDate ? values.kycExpiryDate.format('YYYY-MM-DD') : null,
      onboardedDate: values.onboardedDate ? values.onboardedDate.format('YYYY-MM-DD') : null,
    };
    const result = await saveDraft.mutateAsync({
      id: cpId,
      draft: { core, contacts, bankAccounts, addresses },
    });
    navigate(`/tier1/counterparty/${result.parent.counterpartyId}`, { replace: true });
  }

  const loading = (!isNew && loadingCore) || (!isNew && loadingChildren);

  return (
    <>
      <PageHeader
        title={isNew ? 'New Counterparty' : existing ? existing.legalName : 'Counterparty'}
        description="External trading counterparty, with contacts, bank accounts, and addresses added inline."
        moduleGroup="trade"
        extra={
          <Space>
            <Button onClick={() => navigate('/tier1/counterparty')}>Cancel</Button>
            <Button type="primary" loading={saveDraft.isPending} onClick={handleSave}>
              Save Counterparty
            </Button>
          </Space>
        }
      />

      {loading ? (
        <Spin />
      ) : (
        <Form
          form={coreForm}
          layout="vertical"
          initialValues={{
            cpType: 'TRADER',
            jurisdiction: '',
            creditLimitCurrency: 'USD',
            settlementDays: 2,
            kycStatus: 'PENDING',
            isIntercompany: false,
          }}
        >
          <Tabs
            defaultActiveKey="core"
            items={[
              {
                key: 'core',
                label: 'Core',
                children: (
                  <div style={{ maxWidth: 640 }}>
                    <Form.Item
                      name="cpCode"
                      label="Counterparty Code"
                      rules={[{ required: true }, { max: 20 }]}
                    >
                      <Input placeholder="e.g. GLOBEX-SG" disabled={!isNew} />
                    </Form.Item>
                    <Form.Item
                      name="legalName"
                      label="Legal Name"
                      rules={[{ required: true }, { max: 300 }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item
                      name="shortName"
                      label="Short Name"
                      rules={[{ required: true }, { max: 100 }]}
                    >
                      <Input />
                    </Form.Item>
                    <Form.Item name="leiCode" label="LEI Code">
                      <Input maxLength={20} />
                    </Form.Item>
                    <Form.Item name="cpType" label="Counterparty Type" rules={[{ required: true }]}>
                      <Select options={CP_TYPE_OPTIONS} />
                    </Form.Item>
                    <Form.Item
                      name="jurisdiction"
                      label="Jurisdiction (ISO 2)"
                      rules={[{ required: true }, { len: 2, message: '2-letter code' }]}
                    >
                      <Input maxLength={2} style={{ textTransform: 'uppercase' }} />
                    </Form.Item>
                    <Form.Item name="isIntercompany" label="Intercompany" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                    <Form.Item
                      noStyle
                      shouldUpdate={(prev, cur) => prev.isIntercompany !== cur.isIntercompany}
                    >
                      {({ getFieldValue }) =>
                        getFieldValue('isIntercompany') && (
                          <Form.Item
                            name="internalEntityId"
                            label="Internal Legal Entity"
                            rules={[{ required: true }]}
                          >
                            <Select
                              options={legalEntityOptions}
                              showSearch
                              optionFilterProp="label"
                            />
                          </Form.Item>
                        )
                      }
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                      <Input.TextArea rows={3} maxLength={1000} showCount />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'credit',
                label: 'Credit & KYC',
                children: (
                  <div style={{ maxWidth: 640 }}>
                    <Form.Item name="creditRatingId" label="Credit Rating">
                      <Select options={RATING_OPTIONS} allowClear placeholder="Unrated" />
                    </Form.Item>
                    <Space.Compact block>
                      <Form.Item name="creditLimit" label="Credit Limit" style={{ width: '60%' }}>
                        <InputNumber style={{ width: '100%' }} min={0} />
                      </Form.Item>
                      <Form.Item
                        name="creditLimitCurrency"
                        label="Currency"
                        style={{ width: '40%' }}
                        rules={[{ required: true }, { len: 3 }]}
                      >
                        <Input maxLength={3} style={{ textTransform: 'uppercase' }} />
                      </Form.Item>
                    </Space.Compact>
                    <Form.Item name="creditReviewDate" label="Credit Review Date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      name="settlementDays"
                      label="Settlement Days"
                      rules={[{ required: true }]}
                    >
                      <InputNumber style={{ width: '100%' }} min={0} max={365} />
                    </Form.Item>
                    <Form.Item name="defaultCurrencyId" label="Default Currency">
                      <Select options={CURRENCY_OPTIONS} allowClear />
                    </Form.Item>
                    <Form.Item name="kycStatus" label="KYC Status" rules={[{ required: true }]}>
                      <Select options={KYC_OPTIONS} />
                    </Form.Item>
                    <Form.Item name="kycApprovedDate" label="KYC Approved Date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="kycExpiryDate" label="KYC Expiry Date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="onboardedDate" label="Onboarded Date">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                  </div>
                ),
              },
              {
                key: 'contacts',
                label: (
                  <Badge count={contacts.filter((c) => c.isActive).length} showZero color="default">
                    Contacts
                  </Badge>
                ),
                children: <ContactsSection items={contacts} onChange={setContacts} />,
              },
              {
                key: 'bank',
                label: (
                  <Badge
                    count={bankAccounts.filter((b) => b.isActive).length}
                    showZero
                    color="default"
                  >
                    Bank Accounts
                  </Badge>
                ),
                children: <BankAccountsSection items={bankAccounts} onChange={setBankAccounts} />,
              },
              {
                key: 'address',
                label: (
                  <Badge
                    count={addresses.filter((a) => a.isActive).length}
                    showZero
                    color="default"
                  >
                    Addresses
                  </Badge>
                ),
                children: <AddressesSection items={addresses} onChange={setAddresses} />,
              },
              {
                key: 'guarantees',
                label: 'Guarantees',
                children: (
                  <EntityGuaranteesPanel
                    entityType="COUNTERPARTY"
                    entityId={cpId}
                    defaultRole="principal"
                  />
                ),
              },
            ]}
          />
        </Form>
      )}
    </>
  );
}
