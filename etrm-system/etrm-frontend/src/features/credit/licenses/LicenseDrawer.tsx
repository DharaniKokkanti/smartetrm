import { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Input, Select, Segmented, Switch, Button, Space, Typography } from 'antd';
import dayjs from 'dayjs';
import type { PolymorphicEntityType, LicenseRegistration, LicenseStatus } from '@features/tier1/counterparty/types';
import { useSaveLicenseRegistration } from '@features/tier1/counterparty/hooks';
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

const STATUS_OPTIONS: { label: string; value: LicenseStatus }[] = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Suspended', value: 'SUSPENDED' },
  { label: 'Revoked', value: 'REVOKED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Pending Renewal', value: 'PENDING_RENEWAL' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  editing: LicenseRegistration | null;
}

type FormValues = Omit<LicenseRegistration, 'issueDate' | 'validFrom' | 'validTo' | 'entityType' | 'entityId'> & {
  entityId: number;
  issueDate?: dayjs.Dayjs;
  validFrom?: dayjs.Dayjs;
  validTo?: dayjs.Dayjs;
};

/** Standalone create/edit drawer for one license registration, used by the
 *  cross-entity Licenses Directory page. Mirrors TaxRegistrationDrawer.tsx
 *  exactly (see that file's doc comment) — saves through
 *  saveLicenseRegistrationAssignment (via useSaveLicenseRegistration). */
export function LicenseDrawer({ open, onClose, editing }: Props) {
  const [form] = Form.useForm<FormValues>();
  const skipDraftReset = useDraftValues('license-registration-v', form, open, editing);
  const saveReg = useSaveLicenseRegistration();
  const { data: licenseTypeOptions = [], isLoading: loadingLicenseTypes } = useCustomConfigOptions('LICENSE_TYPE');
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
    // eslint-disable-next-line react-hooks/immutability -- skipDraftReset is a useRef() from useDraftValues; the compiler cannot see refs through a custom hook boundary
    if (skipDraftReset.current) { skipDraftReset.current = false; return; }
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editing) {
      setEntityType(editing.entityType);
      form.setFieldsValue({
        ...editing,
        entityId: editing.entityId,
        issueDate: editing.issueDate ? dayjs(editing.issueDate) : undefined,
        validFrom: editing.validFrom ? dayjs(editing.validFrom) : undefined,
        validTo: editing.validTo ? dayjs(editing.validTo) : undefined,
      });
    } else {
      setEntityType('COUNTERPARTY');
      form.resetFields();
      form.setFieldsValue({
        licenseTypeId: licenseTypeOptions[0]?.value,
        countryId: countries[0]?.countryId,
        status: 'ACTIVE',
        isPrimary: false,
      } as Partial<FormValues>);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing, form, licenseTypeOptions, countries]);

  async function handleSubmit() {
    const values = await form.validateFields();
    const reg: LicenseRegistration = {
      licenseRegId: editing?.licenseRegId ?? null,
      _localId: editing?._localId ?? localId(),
      entityType,
      entityId: values.entityId,
      licenseTypeId: values.licenseTypeId,
      licenseNumber: values.licenseNumber,
      countryId: values.countryId,
      regionState: values.regionState ?? null,
      issuingAuthority: values.issuingAuthority ?? null,
      issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : null,
      validFrom: values.validFrom ? values.validFrom.format('YYYY-MM-DD') : null,
      validTo: values.validTo ? values.validTo.format('YYYY-MM-DD') : null,
      status: values.status,
      isPrimary: values.isPrimary,
      isActive: true,
      notes: values.notes ?? null,
      rowVersion: editing?.rowVersion ?? 0,
    };
    await saveReg.mutateAsync(reg);
    onClose();
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit License — ${editing.licenseNumber}` : 'New License'}
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
          {hint('Owning Entity', 'Which counterparty or legal entity holds this license.')}
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

        <Form.Item name="licenseTypeId" label="License Type" rules={[{ required: true }]}>
          <Select options={licenseTypeOptions} loading={loadingLicenseTypes} />
        </Form.Item>
        <Form.Item name="licenseNumber" label="License Number" rules={[{ required: true }]}>
          <Input placeholder="e.g. FERC-MBR-2019-0451" />
        </Form.Item>
        <Form.Item name="countryId" label="Country" rules={[{ required: true }]}>
          <Select options={countryOptions} loading={loadingCountries} showSearch optionFilterProp="label" placeholder="Select country" />
        </Form.Item>
        <Form.Item name="regionState" label="State / Region">
          <Input placeholder="e.g. Texas — leave blank for country-wide licenses" />
        </Form.Item>
        <Form.Item name="issuingAuthority" label="Issuing Authority">
          <Input placeholder="e.g. FERC, Ofgem, Texas PUC" />
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item name="issueDate" label="Issue Date">
          <AppDatePicker />
        </Form.Item>
        <Form.Item name="validFrom" label="Valid From">
          <AppDatePicker />
        </Form.Item>
        <Form.Item name="validTo" label="Valid To (expiry)">
          <AppDatePicker />
        </Form.Item>
        <Form.Item name="isPrimary" label="Primary License" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} maxLength={1000} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
