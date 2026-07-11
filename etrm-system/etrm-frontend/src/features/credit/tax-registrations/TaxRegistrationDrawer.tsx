import { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Input, Select, Segmented, Switch, Button, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type { PolymorphicEntityType, TaxRegistration } from '@features/tier1/counterparty/types';
import { useSaveTaxRegistration } from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCountries } from '@features/reference/countries/hooks';
import { useDraftValues } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import { hint } from '@components/smart/FieldHint';
import { localId } from '@utils/localId';

const ENTITY_TYPE_OPTIONS = [
  { label: 'Counterparty', value: 'COUNTERPARTY' },
  { label: 'Legal Entity (us)', value: 'LEGAL_ENTITY' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  editing: TaxRegistration | null;
}

type FormValues = Omit<TaxRegistration, 'registrationDate' | 'entityType' | 'entityId'> & {
  entityId: number;
  registrationDate?: dayjs.Dayjs;
};

/** Standalone create/edit drawer for one tax registration, used by the
 *  cross-entity Tax Registrations Directory page. TaxRegistrationsSection.tsx
 *  (via the generic ChildRecordSection) edits a staged items[] array saved
 *  only when the parent Counterparty/Legal Entity form is saved — that
 *  doesn't fit a page whose whole purpose is per-record CRUD against every
 *  entity at once, so this drawer is new. It saves through the existing
 *  saveTaxRegistrationAssignment API call (via useSaveTaxRegistration),
 *  the same one ChildRecordSection ultimately persists through, so the wire
 *  shape and mock endpoint are unchanged — only the entity picker + direct
 *  save is new. */
export function TaxRegistrationDrawer({ open, onClose, editing }: Props) {
  const [form] = Form.useForm<FormValues>();
  const skipDraftReset = useDraftValues('tax-registration-v', form, open, editing);
  const saveReg = useSaveTaxRegistration();
  const { data: taxTypeOptions = [], isLoading: loadingTaxTypes } = useCustomConfigOptions('TAX_TYPE');
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();

  const [entityType, setEntityType] = useState<PolymorphicEntityType>('COUNTERPARTY');

  const countryOptions = countries
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.countryCode} — ${c.countryName}`, value: c.countryId }));

  const entityOptions = useMemo(
    () =>
      entityType === 'LEGAL_ENTITY'
        ? legalEntities.map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }))
        : counterparties.map((c) => ({ label: `${c.cpCode} — ${c.legalName}`, value: c.counterpartyId })),
    [entityType, counterparties, legalEntities],
  );

  useEffect(() => {
    if (!open) return;
    if (skipDraftReset.current) { skipDraftReset.current = false; return; }
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editing) {
      setEntityType(editing.entityType);
      form.setFieldsValue({
        ...editing,
        entityId: editing.entityId,
        registrationDate: editing.registrationDate ? dayjs(editing.registrationDate) : undefined,
      });
    } else {
      setEntityType('COUNTERPARTY');
      form.resetFields();
      form.setFieldsValue({
        taxType: taxTypeOptions.find((o) => o.label === 'VAT')?.value,
        jurisdictionId: countries[0]?.countryId,
        isPrimary: false,
      } as Partial<FormValues>);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing, form, taxTypeOptions, countries]);

  async function handleSubmit() {
    const values = await form.validateFields();
    const reg: TaxRegistration = {
      taxRegId: editing?.taxRegId ?? null,
      _localId: editing?._localId ?? localId(),
      entityType,
      entityId: values.entityId,
      taxType: values.taxType,
      taxId: values.taxId,
      jurisdictionId: values.jurisdictionId,
      issuingAuthority: values.issuingAuthority ?? null,
      registrationDate: values.registrationDate ? values.registrationDate.format('YYYY-MM-DD') : null,
      validFrom: values.validFrom ?? null,
      validTo: values.validTo ?? null,
      isPrimary: values.isPrimary,
      isActive: true,
      notes: values.notes ?? null,
    };
    await saveReg.mutateAsync(reg);
    onClose();
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit Tax Registration — ${editing.taxId}` : 'New Tax Registration'}
      width={460}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={saveReg.isPending}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
          {hint('Owning Entity', 'Which counterparty or legal entity holds this tax registration.')}
        </Typography.Text>
        <Segmented
          options={ENTITY_TYPE_OPTIONS}
          value={entityType}
          onChange={(v) => { setEntityType(v as PolymorphicEntityType); form.setFieldValue('entityId', undefined); }}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Form.Item name="entityId" rules={[{ required: true, message: 'Select an entity' }]}>
          <Select options={entityOptions} showSearch optionFilterProp="label" placeholder="Select entity" />
        </Form.Item>

        <Form.Item name="taxType" label="Tax Type" rules={[{ required: true }]}>
          <Select options={taxTypeOptions} loading={loadingTaxTypes} />
        </Form.Item>
        <Form.Item name="taxId" label="Registration Number" rules={[{ required: true }]}>
          <Input placeholder="e.g. GB123456789" />
        </Form.Item>
        <Form.Item name="jurisdictionId" label="Jurisdiction" rules={[{ required: true }]}>
          <Select options={countryOptions} loading={loadingCountries} showSearch optionFilterProp="label" placeholder="Select country" />
        </Form.Item>
        <Form.Item name="issuingAuthority" label="Issuing Authority">
          <Input placeholder="e.g. HMRC" />
        </Form.Item>
        <Form.Item name="registrationDate" label="Registration Date">
          <AppDatePicker />
        </Form.Item>
        <Form.Item name="isPrimary" label="Primary Registration" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} maxLength={1000} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
