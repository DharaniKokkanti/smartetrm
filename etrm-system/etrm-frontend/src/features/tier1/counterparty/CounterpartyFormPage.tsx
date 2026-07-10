import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Tabs, Form, Input, Select, Switch,
  InputNumber, Button, Space, Spin, Badge,
} from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import type { AddressAssignment, BankAccount, ContactAssignment, CounterpartyInput, TaxRegistration } from './types';
import { CREDIT_RATING_LOOKUP } from './staticLookups';
import { useCounterparty, useCounterparties, useCounterpartyChildren, useSaveCounterpartyDraft } from './hooks';
import { useCustomConfigOptions } from './configLookups';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCountries } from '@features/reference/countries/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { ContactsSection } from './ContactsSection';
import { BankAccountsSection } from './BankAccountsSection';
import { AddressesSection } from './AddressesSection';
import { TaxRegistrationsSection } from './TaxRegistrationsSection';
import { EntityGuaranteesPanel } from '@features/tier1/guarantee/EntityGuaranteesPanel';
import { usePageFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';

const RATING_OPTIONS = CREDIT_RATING_LOOKUP.map((r) => ({ label: `${r.agency} ${r.rating}`, value: r.creditRatingId }));

type CoreFormValues = Omit<CounterpartyInput, 'creditReviewDate' | 'kycApprovedDate' | 'kycExpiryDate' | 'onboardedDate'> & {
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
  const { data: counterparties } = useCounterparties();
  const saveDraft = useSaveCounterpartyDraft();
  const { data: cpTypeOptions = [], isLoading: loadingCpTypes } = useCustomConfigOptions('COUNTERPARTY_TYPE');
  const { data: kycStatusOptions = [], isLoading: loadingKycStatus } = useCustomConfigOptions('KYC_STATUS');
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const countryOptions = countries
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.countryCode} — ${c.countryName}`, value: c.countryCode }));
  const currencyCodeOptions = currencies
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.currencyCode} — ${c.currencyName}`, value: c.currencyCode }));
  const currencyIdOptions = currencies
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.currencyCode} — ${c.currencyName}`, value: c.currencyId }));

  const [contacts, setContacts] = useState<ContactAssignment[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [addresses, setAddresses] = useState<AddressAssignment[]>([]);
  const [taxRegistrations, setTaxRegistrations] = useState<TaxRegistration[]>([]);

  const activeRef = useRef(true);
  const { skipFormSyncRef, skipExtraSyncRef } = usePageFormDraft('counterparty', {
    form: coreForm,
    recordId: cpId,
    activeRef,
    extra: () => ({ contacts, bankAccounts, addresses, taxRegistrations }),
    onRestore: (_values, extra) => {
      setContacts((extra?.contacts as ContactAssignment[] | undefined) ?? []);
      setBankAccounts((extra?.bankAccounts as BankAccount[] | undefined) ?? []);
      setAddresses((extra?.addresses as AddressAssignment[] | undefined) ?? []);
      setTaxRegistrations((extra?.taxRegistrations as TaxRegistration[] | undefined) ?? []);
    },
    meta: () => ({
      route: isNew ? '/tier1/counterparty/new' : `/tier1/counterparty/${cpId}`,
      label: existing ? existing.legalName : 'New Counterparty',
    }),
  });

  // Defaults for cpType/kycStatus are numeric FK ids resolved from the async
  // lookup options — can't go in `initialValues` (evaluated before the
  // options query resolves), and only apply to a genuinely new, untouched form.
  useEffect(() => {
    if (!isNew) return;
    const defaults: { cpType?: number; kycStatus?: number } = {};
    if (coreForm.getFieldValue('cpType') === undefined) {
      const def = cpTypeOptions.find((o) => o.label === 'Trader')?.value;
      if (def !== undefined) defaults.cpType = def;
    }
    if (coreForm.getFieldValue('kycStatus') === undefined) {
      const def = kycStatusOptions.find((o) => o.label === 'Pending')?.value;
      if (def !== undefined) defaults.kycStatus = def;
    }
    if (Object.keys(defaults).length) coreForm.setFieldsValue(defaults);
  }, [isNew, cpTypeOptions, kycStatusOptions, coreForm]);

  useEffect(() => {
    if (skipFormSyncRef.current) { skipFormSyncRef.current = false; return; }
    if (existing) {
      coreForm.setFieldsValue({
        ...existing,
        creditReviewDate: existing.creditReviewDate ? dayjs(existing.creditReviewDate) : undefined,
        kycApprovedDate: existing.kycApprovedDate ? dayjs(existing.kycApprovedDate) : undefined,
        kycExpiryDate: existing.kycExpiryDate ? dayjs(existing.kycExpiryDate) : undefined,
        onboardedDate: existing.onboardedDate ? dayjs(existing.onboardedDate) : undefined,
      });
    }
  }, [existing, coreForm, skipFormSyncRef]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (skipExtraSyncRef.current) { skipExtraSyncRef.current = false; return; }
    if (existingChildren) {
      setContacts(existingChildren.contacts.map((c) => ({ ...c, _localId: `srv-ec-${c.entityContactId}` })));
      setBankAccounts(existingChildren.bankAccounts.map((b) => ({ ...b, _localId: `srv-b-${b.bankAccountId}` })));
      setAddresses(existingChildren.addresses.map((a) => ({ ...a, _localId: `srv-ea-${a.entityAddressId}` })));
      setTaxRegistrations(existingChildren.taxRegistrations.map((t) => ({ ...t, _localId: `srv-tr-${t.taxRegId}` })));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [existingChildren, skipExtraSyncRef]);

  const legalEntityOptions = useMemo(
    () => (legalEntities ?? []).map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId })),
    [legalEntities],
  );
  const parentCounterpartyOptions = useMemo(
    () => (counterparties ?? [])
      .filter((c) => c.counterpartyId !== cpId)
      .map((c) => ({ label: `${c.cpCode} — ${c.legalName}`, value: c.counterpartyId })),
    [counterparties, cpId],
  );

  async function handleSave() {
    const values = await coreForm.validateFields();
    const core: CounterpartyInput = {
      ...values,
      // Keep parentCounterpartyId consistent with parentInd — mirrors the
      // DB's chk_cp_parent_ind_consistency CHECK (V62).
      parentCounterpartyId: values.parentInd ? values.parentCounterpartyId : null,
      creditReviewDate: values.creditReviewDate ? values.creditReviewDate.format('YYYY-MM-DD') : null,
      kycApprovedDate: values.kycApprovedDate ? values.kycApprovedDate.format('YYYY-MM-DD') : null,
      kycExpiryDate: values.kycExpiryDate ? values.kycExpiryDate.format('YYYY-MM-DD') : null,
      onboardedDate: values.onboardedDate ? values.onboardedDate.format('YYYY-MM-DD') : null,
    };
    const result = await saveDraft.mutateAsync({ id: cpId, draft: { core, contacts, bankAccounts, addresses, taxRegistrations } });
    activeRef.current = false;
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
            <Button onClick={() => { activeRef.current = false; navigate('/tier1/counterparty'); }}>Cancel</Button>
            <Button type="primary" loading={saveDraft.isPending} onClick={handleSave}>Save Counterparty</Button>
          </Space>
        }
      />

      {loading ? <Spin /> : (
        <Form form={coreForm} layout="vertical" initialValues={{ creditLimitCurrency: 'USD', settlementDays: 2, isIntercompany: false, parentInd: false }}>
          <Tabs defaultActiveKey="core" items={[
            {
              key: 'core', label: 'Core',
              children: (
                <div style={{ maxWidth: 640 }}>
                  <Form.Item name="cpCode" label="Counterparty Code" rules={[{ required: true }, { max: 20 }]}>
                    <Input placeholder="e.g. GLOBEX-SG" disabled={!isNew} />
                  </Form.Item>
                  <Form.Item name="legalName" label="Legal Name" rules={[{ required: true }, { max: 300 }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item name="shortName" label="Short Name" rules={[{ required: true }, { max: 100 }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    name="leiCode"
                    label={hint('LEI Code', 'Global Legal Entity Identifier (ISO 17442) — required for EMIR/Dodd-Frank trade reporting.', '5493001KJTIIGC8Y1R12')}
                  ><Input maxLength={20} /></Form.Item>
                  <Form.Item name="cpType" label={hint('Counterparty Type', 'FCM/Prime Broker = the legal counterparty on exchange trades, not a fee-only broker (those are IDBs, tracked separately). Intercompany = internal affiliate — nets out at group level rather than carrying external credit risk.')} rules={[{ required: true }]}>
                    <Select options={cpTypeOptions} loading={loadingCpTypes} />
                  </Form.Item>
                  <Form.Item
                    name="jurisdiction"
                    label={hint('Jurisdiction (ISO 2)', 'The country whose law governs contracts with this counterparty — drives default netting and dispute-resolution rules.', 'GB')}
                    rules={[{ required: true }]}
                  >
                    <Select options={countryOptions} loading={loadingCountries} showSearch optionFilterProp="label" placeholder="Select country" />
                  </Form.Item>
                  <Form.Item
                    name="isIntercompany"
                    label={hint('Intercompany', 'Marks this counterparty as an internal group affiliate rather than a genuine external trading partner — trades against it net out at the group level rather than carrying external credit risk.')}
                    valuePropName="checked"
                  ><Switch /></Form.Item>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isIntercompany !== cur.isIntercompany}>
                    {({ getFieldValue }) =>
                      getFieldValue('isIntercompany') && (
                        <Form.Item name="internalEntityId" label="Internal Legal Entity" rules={[{ required: true }]}>
                          <Select options={legalEntityOptions} showSearch optionFilterProp="label" />
                        </Form.Item>
                      )
                    }
                  </Form.Item>
                  <Form.Item
                    name="parentInd"
                    label={hint('Has Parent Company', 'Enable if this counterparty is a subsidiary of another counterparty already in the system — e.g. a trading arm whose ultimate parent also trades with the firm directly.')}
                    valuePropName="checked"
                  >
                    <Switch onChange={(checked) => { if (!checked) coreForm.setFieldValue('parentCounterpartyId', null); }} />
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate={(prev, cur) => prev.parentInd !== cur.parentInd}>
                    {({ getFieldValue }) => (
                      <Form.Item name="parentCounterpartyId" label="Parent Counterparty" rules={[{ required: !!getFieldValue('parentInd') }]}>
                        <Select
                          options={parentCounterpartyOptions}
                          placeholder={getFieldValue('parentInd') ? 'Select parent counterparty' : 'Enable "Has Parent Company" first'}
                          disabled={!getFieldValue('parentInd')}
                          allowClear showSearch optionFilterProp="label"
                        />
                      </Form.Item>
                    )}
                  </Form.Item>
                  <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} maxLength={1000} showCount /></Form.Item>
                </div>
              ),
            },
            {
              key: 'credit', label: 'Credit & KYC',
              children: (
                <div style={{ maxWidth: 640 }}>
                  <Form.Item
                    name="creditRatingId"
                    label={hint('Credit Rating', 'External or internal credit rating used to size this counterparty’s overall credit exposure. Leave blank if unrated.')}
                  >
                    <Select options={RATING_OPTIONS} allowClear placeholder="Unrated" />
                  </Form.Item>
                  <Space.Compact block>
                    <Form.Item
                      name="creditLimit"
                      label={hint('Credit Limit', 'Simple headline exposure ceiling shown here; granular per-tenor/instrument limits are managed on the Credit Limits page.')}
                      style={{ width: '60%' }}
                    >
                      <InputNumber style={{ width: '100%' }} min={0} />
                    </Form.Item>
                    <Form.Item name="creditLimitCurrency" label="Currency" style={{ width: '40%' }} rules={[{ required: true }]}>
                      <Select options={currencyCodeOptions} loading={loadingCurrencies} showSearch optionFilterProp="label" />
                    </Form.Item>
                  </Space.Compact>
                  <Form.Item name="creditReviewDate" label="Credit Review Date"><AppDatePicker /></Form.Item>
                  <Form.Item
                    name="settlementDays"
                    label={hint('Settlement Days', 'Default number of business days from trade date to settlement/payment for this counterparty — feeds payment-term defaults on new trades.', '2')}
                    rules={[{ required: true }]}
                  >
                    <InputNumber style={{ width: '100%' }} min={0} max={365} />
                  </Form.Item>
                  <Form.Item name="defaultCurrencyId" label="Default Currency">
                    <Select options={currencyIdOptions} loading={loadingCurrencies} allowClear showSearch optionFilterProp="label" />
                  </Form.Item>
                  <Form.Item
                    name="kycStatus"
                    label={hint('KYC Status', 'Know-Your-Customer onboarding/compliance status — trading may be blocked or restricted until this is APPROVED.')}
                    rules={[{ required: true }]}
                  >
                    <Select options={kycStatusOptions} loading={loadingKycStatus} />
                  </Form.Item>
                  <Form.Item name="kycApprovedDate" label="KYC Approved Date"><AppDatePicker /></Form.Item>
                  <Form.Item
                    name="kycExpiryDate"
                    label={hint('KYC Expiry Date', 'Date the KYC approval lapses and must be re-reviewed — periodic re-KYC is a standard AML control.')}
                  ><AppDatePicker /></Form.Item>
                  <Form.Item name="onboardedDate" label="Onboarded Date"><AppDatePicker /></Form.Item>
                </div>
              ),
            },
            {
              key: 'contacts',
              label: <Badge count={contacts.filter((c) => c.isActive).length} showZero color="default">Contacts</Badge>,
              children: <ContactsSection items={contacts} onChange={setContacts} entityType="COUNTERPARTY" />,
            },
            {
              key: 'bank',
              label: <Badge count={bankAccounts.filter((b) => b.isActive).length} showZero color="default">Bank Accounts</Badge>,
              children: <BankAccountsSection items={bankAccounts} onChange={setBankAccounts} />,
            },
            {
              key: 'address',
              label: <Badge count={addresses.filter((a) => a.isActive).length} showZero color="default">Addresses</Badge>,
              children: <AddressesSection items={addresses} onChange={setAddresses} entityType="COUNTERPARTY" />,
            },
            {
              key: 'tax',
              label: <Badge count={taxRegistrations.filter((t) => t.isActive).length} showZero color="default">Tax Registrations</Badge>,
              children: <TaxRegistrationsSection items={taxRegistrations} onChange={setTaxRegistrations} entityType="COUNTERPARTY" />,
            },
            {
              key: 'guarantees', label: 'Guarantees',
              children: <EntityGuaranteesPanel entityType="COUNTERPARTY" entityId={cpId} defaultRole="principal" />,
            },
          ]} />
        </Form>
      )}
    </>
  );
}
