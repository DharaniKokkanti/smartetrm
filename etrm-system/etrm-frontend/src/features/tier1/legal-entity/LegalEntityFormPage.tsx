import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Tabs, Form, Input, Select, Switch,
  Button, Space, Divider, Spin, Badge,
} from 'antd';
import dayjs from 'dayjs';
import { PageHeader } from '@components/layout/PageHeader';
import { StickyFormFooter } from '@components/layout/StickyFormFooter';
import type { LegalEntityInput } from './types';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useLegalEntity, useLegalEntities, useLegalEntityChildren, useSaveLegalEntityDraft } from './hooks';
import { useCountries } from '@features/reference/countries/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { EntityGuaranteesPanel } from '@features/tier1/guarantee/EntityGuaranteesPanel';
import { LegalEntityOwnershipPanel } from './LegalEntityOwnershipPanel';
import { AddressesSection } from '@features/tier1/counterparty/AddressesSection';
import { ContactsSection } from '@features/tier1/counterparty/ContactsSection';
import { TaxRegistrationsSection } from '@features/tier1/counterparty/TaxRegistrationsSection';
import type { AddressAssignment, ContactAssignment, TaxRegistration } from '@features/tier1/counterparty/types';
import { usePageFormDraft } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';

type FormValues = Omit<LegalEntityInput, 'goLiveDate'> & { goLiveDate?: dayjs.Dayjs };

export function LegalEntityFormPage() {
  const { id: idParam } = useParams();
  const navigate = useNavigate();
  const isNew = !idParam || idParam === 'new';
  const leId = isNew ? null : Number(idParam);

  const [form] = Form.useForm<FormValues>();
  const { data: existing, isLoading: loadingCore } = useLegalEntity(leId);
  const { data: existingChildren, isLoading: loadingChildren } = useLegalEntityChildren(leId);
  const { data: entities } = useLegalEntities();
  const { data: entityTypeOptions = [], isLoading: loadingEntityTypes } = useCustomConfigOptions('LEGAL_ENTITY_TYPE');
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const countryOptions = countries
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.countryCode} — ${c.countryName}`, value: c.countryId }));
  const currencyOptions = currencies
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.currencyCode} — ${c.currencyName}`, value: c.currencyId }));
  const saveDraft = useSaveLegalEntityDraft();

  const [addresses, setAddresses] = useState<AddressAssignment[]>([]);
  const [contacts, setContacts] = useState<ContactAssignment[]>([]);
  const [taxRegistrations, setTaxRegistrations] = useState<TaxRegistration[]>([]);

  const activeRef = useRef(true);
  const { skipFormSyncRef, skipExtraSyncRef } = usePageFormDraft('legal-entity', {
    form,
    recordId: leId,
    activeRef,
    extra: () => ({ addresses, contacts, taxRegistrations }),
    onRestore: (_values, extra) => {
      setAddresses((extra?.addresses as AddressAssignment[] | undefined) ?? []);
      setContacts((extra?.contacts as ContactAssignment[] | undefined) ?? []);
      setTaxRegistrations((extra?.taxRegistrations as TaxRegistration[] | undefined) ?? []);
    },
    meta: () => ({
      route: isNew ? '/tier1/legal-entity/new' : `/tier1/legal-entity/${leId}`,
      label: existing ? existing.entityCode : 'New Legal Entity',
    }),
  });

  useEffect(() => {
    if (skipFormSyncRef.current) { skipFormSyncRef.current = false; return; }
    if (existing) {
      form.setFieldsValue({
        ...existing,
        goLiveDate: existing.goLiveDate ? dayjs(existing.goLiveDate) : undefined,
      });
    }
  }, [existing, form, skipFormSyncRef]);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    if (skipExtraSyncRef.current) { skipExtraSyncRef.current = false; return; }
    if (existingChildren) {
      setAddresses(existingChildren.addresses.map((a) => ({ ...a, _localId: `srv-ea-${a.entityAddressId}` })));
      setContacts(existingChildren.contacts.map((c) => ({ ...c, _localId: `srv-ec-${c.entityContactId}` })));
      setTaxRegistrations(existingChildren.taxRegistrations.map((t) => ({ ...t, _localId: `srv-tr-${t.taxRegId}` })));
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [existingChildren, skipExtraSyncRef]);

  const parentOptions = (entities ?? [])
    .filter((e) => e.legalEntityId !== leId)
    .map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }));

  const parentIndWatched = Form.useWatch('parentInd', form);

  async function handleSave() {
    const values = await form.validateFields();
    const core: LegalEntityInput = {
      ...values,
      // Keep parentEntityId consistent with parentInd — mirrors the DB's
      // chk_le_parent_ind_consistency CHECK (V62).
      parentEntityId: values.parentInd ? values.parentEntityId : null,
      goLiveDate: values.goLiveDate ? values.goLiveDate.format('YYYY-MM-DD') : null,
      // V127 — echo back the version this client last read (not a form
      // field the user edits) so the backend can detect a concurrent edit;
      // 0 for a brand-new record, ignored by Hibernate on insert anyway.
      rowVersion: existing?.rowVersion ?? 0,
    };
    const result = await saveDraft.mutateAsync({ id: leId, draft: { core, addresses, contacts, taxRegistrations } });
    activeRef.current = false;
    navigate(`/tier1/legal-entity/${result.parent.legalEntityId}`, { replace: true });
  }

  const loading = (!isNew && loadingCore) || (!isNew && loadingChildren);

  return (
    <>
      <PageHeader
        title={isNew ? 'New Legal Entity' : existing ? existing.entityCode : 'Legal Entity'}
        description="Internal trading company, subsidiary, or branch — with contacts, addresses, guarantees, and (for joint ventures) ownership added inline."
        moduleGroup="trade"
      />

      {loading ? <Spin /> : (
        <Form form={form} layout="vertical" initialValues={{ isInternal: true, baseCurrencyId: 1, parentInd: false }}>
          <Tabs defaultActiveKey="details" items={[
            {
              key: 'details',
              label: 'Details',
              children: (
                <div style={{ maxWidth: 640 }}>
                  <Form.Item name="entityCode" label="Entity Code" rules={[{ required: true, message: 'Required' }, { max: 20 }]}>
                    <Input placeholder="e.g. ACME-UK" disabled={!isNew} />
                  </Form.Item>
                  <Form.Item name="entityName" label="Entity Name" rules={[{ required: true, message: 'Required' }, { max: 200 }]}>
                    <Input placeholder="e.g. Acme Trading UK Limited" />
                  </Form.Item>
                  <Form.Item name="shortName" label="Short Name" rules={[{ required: true, message: 'Required' }, { max: 100 }]}>
                    <Input placeholder="e.g. Acme UK" />
                  </Form.Item>
                  <Form.Item
                    name="leiCode"
                    label={hint('LEI Code', 'Global Legal Entity Identifier (ISO 17442) — required for EMIR/Dodd-Frank trade reporting and used to identify the entity on regulatory submissions.', '5493001KJTIIGC8Y1R12')}
                    rules={[{ max: 20 }]}
                  >
                    <Input placeholder="20-character Legal Entity Identifier" />
                  </Form.Item>
                  <Form.Item name="entityType" label={hint('Entity Type', 'Determines regulatory scope and guarantor eligibility — Holding companies don\'t trade directly; Branches inherit the parent\'s licence rather than holding their own; Joint Venture entities can have their ownership cap table set on the Ownership tab.')} rules={[{ required: true, message: 'Required' }]}>
                    <Select options={entityTypeOptions} loading={loadingEntityTypes} placeholder="Select type" />
                  </Form.Item>
                  <Form.Item
                    name="parentInd"
                    label={hint('Has Parent Entity', 'Enable if this entity is a subsidiary of another legal entity in the group — drives group hierarchy/consolidation reporting.')}
                    valuePropName="checked"
                  >
                    <Switch onChange={(checked) => { if (!checked) form.setFieldValue('parentEntityId', null); }} />
                  </Form.Item>
                  <Form.Item name="parentEntityId" label="Parent Entity">
                    <Select
                      options={parentOptions}
                      placeholder={parentIndWatched ? 'Select parent entity' : 'Enable "Has Parent Entity" first'}
                      disabled={!parentIndWatched}
                      allowClear showSearch optionFilterProp="label"
                    />
                  </Form.Item>

                  <Divider style={{ margin: '8px 0 16px' }} />

                  <Space.Compact block>
                    <Form.Item
                      name="jurisdictionId"
                      label={hint('Jurisdiction', 'The country whose law governs this entity’s trading contracts — drives which regulatory regime and default netting rules apply.', 'GB')}
                      style={{ width: '50%' }}
                      rules={[{ required: true, message: 'Required' }]}
                    >
                      <Select
                        options={countryOptions}
                        loading={loadingCountries}
                        placeholder="Select country"
                        showSearch
                        optionFilterProp="label"
                      />
                    </Form.Item>
                    <Form.Item name="incorporationCountryId" label="Incorporation Country" style={{ width: '50%' }}>
                      <Select
                        options={countryOptions}
                        loading={loadingCountries}
                        placeholder="Select country"
                        allowClear showSearch optionFilterProp="label"
                      />
                    </Form.Item>
                  </Space.Compact>

                  <Form.Item name="incorporationNumber" label="Incorporation Number">
                    <Input placeholder="Companies House number, etc." />
                  </Form.Item>
                  <Form.Item
                    name="baseCurrencyId"
                    label={hint('Base Currency', 'Functional currency this entity’s books, P&L, and financial statements are measured in.', 'USD')}
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <Select
                      options={currencyOptions}
                      loading={loadingCurrencies}
                      placeholder="Select currency"
                      showSearch
                      optionFilterProp="label"
                    />
                  </Form.Item>
                  <Form.Item name="defaultTimezone" label="Default Timezone">
                    <Input placeholder="Europe/London" />
                  </Form.Item>

                  <Divider style={{ margin: '8px 0 16px' }} />

                  <Form.Item
                    name="regulator"
                    label={hint('Regulator', 'The financial/commodity regulator this entity is licensed and supervised under.', 'FCA')}
                  ><Input placeholder="e.g. FCA" /></Form.Item>
                  <Form.Item name="regulatoryLicence" label="Regulatory Licence"><Input /></Form.Item>
                  <Form.Item
                    name="isInternal"
                    label={hint('Internal Entity', 'Marks this as one of the firm’s own booking entities rather than an external counterparty being onboarded as a legal entity.')}
                    valuePropName="checked"
                  ><Switch /></Form.Item>
                  <Form.Item name="goLiveDate" label="Go-Live Date"><AppDatePicker /></Form.Item>
                  <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} maxLength={1000} showCount /></Form.Item>
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
              children: <ContactsSection items={contacts} onChange={setContacts} entityType="LEGAL_ENTITY" />,
            },
            {
              key: 'addresses',
              label: (
                <Badge count={addresses.filter((a) => a.isActive).length} showZero color="default">
                  Addresses
                </Badge>
              ),
              children: <AddressesSection items={addresses} onChange={setAddresses} entityType="LEGAL_ENTITY" />,
            },
            {
              key: 'tax',
              label: (
                <Badge count={taxRegistrations.filter((t) => t.isActive).length} showZero color="default">
                  Tax Registrations
                </Badge>
              ),
              children: <TaxRegistrationsSection items={taxRegistrations} onChange={setTaxRegistrations} entityType="LEGAL_ENTITY" />,
            },
            {
              key: 'guarantees',
              label: 'Guarantees',
              children: (
                <EntityGuaranteesPanel
                  entityType="LEGAL_ENTITY"
                  entityId={leId}
                  defaultRole="guarantor"
                />
              ),
            },
            {
              key: 'ownership',
              label: 'Ownership',
              children: (
                <LegalEntityOwnershipPanel jvEntityId={leId} />
              ),
            },
          ]} />
        </Form>
      )}

      {!loading && (
        <StickyFormFooter>
          <Space>
            <Button onClick={() => { activeRef.current = false; navigate('/tier1/legal-entity'); }}>Cancel</Button>
            <Button type="primary" loading={saveDraft.isPending} onClick={handleSave}>Save Legal Entity</Button>
          </Space>
        </StickyFormFooter>
      )}
    </>
  );
}
