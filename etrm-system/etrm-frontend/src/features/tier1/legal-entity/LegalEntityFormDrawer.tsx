import { useEffect, useState } from 'react';
import {
  App as AntApp, Drawer, Form, Input, Select, Switch,
  Button, Space, Divider, Tabs, Badge, Spin,
} from 'antd';
import dayjs from 'dayjs';
import type { LegalEntity, LegalEntityInput } from './types';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useCreateLegalEntity, useUpdateLegalEntity, useLegalEntities } from './hooks';
import { useCountries } from '@features/reference/countries/hooks';
import { useCurrencies } from '@features/reference/currencies/hooks';
import { EntityGuaranteesPanel } from '@features/tier1/guarantee/EntityGuaranteesPanel';
import { AddressesSection } from '@features/tier1/counterparty/AddressesSection';
import { ContactsSection } from '@features/tier1/counterparty/ContactsSection';
import { TaxRegistrationsSection } from '@features/tier1/counterparty/TaxRegistrationsSection';
import type { AddressAssignment, ContactAssignment, TaxRegistration } from '@features/tier1/counterparty/types';
import {
  fetchEntityAddresses, fetchEntityContacts, fetchEntityTaxRegistrations,
  saveAddressAssignment, saveContactAssignment, saveTaxRegistrationAssignment,
} from '@features/tier1/counterparty/api';
import { useQueryClient } from '@tanstack/react-query';
import { useDraftValues } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';

interface Props {
  onSaved?: (saved: LegalEntity) => void;  // called on Save (stay open) so parent can switch to edit mode
  open: boolean;
  onClose: () => void;
  editing: LegalEntity | null;
}

type FormValues = Omit<LegalEntityInput, 'goLiveDate'> & { goLiveDate?: dayjs.Dayjs };

export function LegalEntityFormDrawer({ open, onClose, editing, onSaved }: Props) {
  const [form] = Form.useForm<FormValues>();
  const skipDraftReset = useDraftValues('tier1-legal-entity-v', form, open, editing);
  const { data: entities } = useLegalEntities();
  const { data: entityTypeOptions = [], isLoading: loadingEntityTypes } = useCustomConfigOptions('LEGAL_ENTITY_TYPE');
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: currencies = [], isLoading: loadingCurrencies } = useCurrencies();
  const countryOptions = countries
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.countryCode} — ${c.countryName}`, value: c.countryCode }));
  const currencyOptions = currencies
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.currencyCode} — ${c.currencyName}`, value: c.currencyCode }));
  const createMutation = useCreateLegalEntity();
  const updateMutation = useUpdateLegalEntity();
  const queryClient = useQueryClient();
  const { message } = AntApp.useApp();
  const saving = createMutation.isPending || updateMutation.isPending;

  const [addresses, setAddresses] = useState<AddressAssignment[]>([]);
  const [contacts, setContacts] = useState<ContactAssignment[]>([]);
  const [taxRegistrations, setTaxRegistrations] = useState<TaxRegistration[]>([]);
  const [loadingChildren, setLoadingChildren] = useState(false);

  useEffect(() => {
    if (skipDraftReset.current) { if (open) skipDraftReset.current = false; return; }
    if (open && editing) {
      form.setFieldsValue({
        ...editing,
        goLiveDate: editing.goLiveDate ? dayjs(editing.goLiveDate) : undefined,
      });
      setLoadingChildren(true);
      Promise.all([
        fetchEntityAddresses('LEGAL_ENTITY', editing.legalEntityId),
        fetchEntityContacts('LEGAL_ENTITY', editing.legalEntityId),
        fetchEntityTaxRegistrations('LEGAL_ENTITY', editing.legalEntityId),
      ])
        .then(([addrs, contacts, taxRegs]) => {
          setAddresses(addrs.map((a) => ({ ...a, _localId: `srv-ea-${a.entityAddressId}` })));
          setContacts(contacts.map((c) => ({ ...c, _localId: `srv-ec-${c.entityContactId}` })));
          setTaxRegistrations(taxRegs.map((t) => ({ ...t, _localId: `srv-tr-${t.taxRegId}` })));
        })
        .finally(() => setLoadingChildren(false));
    } else if (open) {
      form.resetFields();
      setAddresses([]);
      setContacts([]);
      setTaxRegistrations([]);
    }
  }, [open, editing, form]);

  const parentOptions = (entities ?? [])
    .filter((e) => e.legalEntityId !== editing?.legalEntityId)
    .map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }));

  const parentIndWatched = Form.useWatch('parentInd', form);

  async function handleSubmit(closeAfter = true) {
    const values = await form.validateFields();
    const input: LegalEntityInput = {
      ...values,
      // Keep parentEntityId consistent with parentInd — mirrors the DB's
      // chk_le_parent_ind_consistency CHECK (V62).
      parentEntityId: values.parentInd ? values.parentEntityId : null,
      goLiveDate: values.goLiveDate ? values.goLiveDate.format('YYYY-MM-DD') : null,
    };

    const savedEntity = editing
      ? await updateMutation.mutateAsync({ id: editing.legalEntityId, input })
      : await createMutation.mutateAsync(input);

    const leId = savedEntity.legalEntityId;

    const errors: string[] = [];
    for (const a of addresses) {
      try {
        await saveAddressAssignment({ ...a, entityType: 'LEGAL_ENTITY', entityId: leId });
      } catch {
        errors.push(`Address "${a.address.addressLine1}" failed to save.`);
      }
    }
    for (const c of contacts) {
      try {
        await saveContactAssignment({ ...c, entityType: 'LEGAL_ENTITY', entityId: leId });
      } catch {
        errors.push(`Contact "${c.contact.firstName} ${c.contact.lastName}" failed to save.`);
      }
    }
    for (const t of taxRegistrations) {
      try {
        await saveTaxRegistrationAssignment({ ...t, entityType: 'LEGAL_ENTITY', entityId: leId });
      } catch {
        errors.push(`Tax registration "${t.taxType} ${t.taxId}" failed to save.`);
      }
    }

    queryClient.invalidateQueries({ queryKey: ['address-pool'] });
    queryClient.invalidateQueries({ queryKey: ['contact-pool'] });
    if (errors.length > 0) {
      message.warning(`Legal entity saved, but ${errors.length} record(s) failed: ${errors.join(' ')}`);
    }
    if (closeAfter) onClose(); else onSaved?.(savedEntity);
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit ${editing.entityCode}` : 'New Legal Entity'}
      width={600}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => { void handleSubmit(false); }} loading={saving}>Save</Button>
          <Button type="primary" onClick={() => { void handleSubmit(true); }} loading={saving}>Save & Close</Button>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="details"
        items={[
          {
            key: 'details',
            label: 'Details',
            children: (
              <Form form={form} layout="vertical" initialValues={{ isInternal: true, baseCurrency: 'USD', parentInd: false }}>
                <Form.Item name="entityCode" label="Entity Code" rules={[{ required: true, message: 'Required' }, { max: 20 }]}>
                  <Input placeholder="e.g. ACME-UK" disabled={!!editing} />
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
                <Form.Item name="entityType" label="Entity Type" rules={[{ required: true, message: 'Required' }]}>
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
                    name="jurisdiction"
                    label={hint('Jurisdiction (ISO 2)', 'The country whose law governs this entity’s trading contracts — drives which regulatory regime and default netting rules apply.', 'GB')}
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
                  <Form.Item name="incorporationCountry" label="Incorporation Country" style={{ width: '50%' }}>
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
                  name="baseCurrency"
                  label={hint('Base Currency (ISO 3)', 'Functional currency this entity’s books, P&L, and financial statements are measured in.', 'USD')}
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
              </Form>
            ),
          },
          {
            key: 'contacts',
            label: (
              <Badge count={contacts.filter((c) => c.isActive).length} showZero color="default">
                Contacts
              </Badge>
            ),
            children: loadingChildren ? (
              <Spin style={{ display: 'block', marginTop: 40 }} />
            ) : (
              <ContactsSection items={contacts} onChange={setContacts} entityType="LEGAL_ENTITY" />
            ),
          },
          {
            key: 'addresses',
            label: (
              <Badge count={addresses.filter((a) => a.isActive).length} showZero color="default">
                Addresses
              </Badge>
            ),
            children: loadingChildren ? (
              <Spin style={{ display: 'block', marginTop: 40 }} />
            ) : (
              <AddressesSection items={addresses} onChange={setAddresses} entityType="LEGAL_ENTITY" />
            ),
          },
          {
            key: 'tax',
            label: (
              <Badge count={taxRegistrations.filter((t) => t.isActive).length} showZero color="default">
                Tax Registrations
              </Badge>
            ),
            children: loadingChildren ? (
              <Spin style={{ display: 'block', marginTop: 40 }} />
            ) : (
              <TaxRegistrationsSection items={taxRegistrations} onChange={setTaxRegistrations} entityType="LEGAL_ENTITY" />
            ),
          },
          {
            key: 'guarantees',
            label: 'Guarantees',
            children: (
              <EntityGuaranteesPanel
                entityType="LEGAL_ENTITY"
                entityId={editing?.legalEntityId ?? null}
                defaultRole="guarantor"
              />
            ),
          },
        ]}
      />
    </Drawer>
  );
}
