import { Form, Input, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChildRecordSection, PrimaryTag } from './ChildRecordSection';
import type { PolymorphicEntityType, TaxRegistration } from './types';
import { useCustomConfigOptions } from './configLookups';
import { useCountries } from '@features/reference/countries/hooks';
import { localId } from '@utils/localId';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs from 'dayjs';
import { hint } from '@components/smart/FieldHint';

interface Props {
  items: TaxRegistration[];
  onChange: (items: TaxRegistration[]) => void;
  entityType?: PolymorphicEntityType;
}

/** VAT/GST/tax-ID registrations — dbo.tax_registration, shared by
 *  LEGAL_ENTITY and COUNTERPARTY. Was a placeholder in the schema with no
 *  frontend at all; built following the same ChildRecordSection pattern as
 *  BankAccountsSection (no pooling — each registration belongs to one entity). */
export function TaxRegistrationsSection({ items, onChange, entityType = 'COUNTERPARTY' }: Props) {
  const { data: taxTypeOptions = [], isLoading: loadingTaxTypes } = useCustomConfigOptions('TAX_TYPE');
  const { data: countries = [], isLoading: loadingCountries } = useCountries();
  const countryOptions = countries
    .filter((c) => c.isActive)
    .map((c) => ({ label: `${c.countryCode} — ${c.countryName}`, value: c.countryId }));
  const countryLabelById = new Map(countries.map((c) => [c.countryId, `${c.countryCode} — ${c.countryName}`]));
  const columns: ColumnsType<TaxRegistration> = [
    { title: 'Type', dataIndex: 'taxType', width: 90, render: (v: number) => taxTypeOptions.find((o) => o.value === v)?.label ?? '—' },
    { title: 'Registration No.', dataIndex: 'taxId' },
    { title: 'Jurisdiction', dataIndex: 'jurisdictionId', width: 100, render: (v: number) => countryLabelById.get(v) ?? '—' },
    { title: 'Issuing Authority', dataIndex: 'issuingAuthority', render: (v) => v || '—' },
    { title: '', key: 'primary', width: 80, render: (_, r) => <PrimaryTag isPrimary={r.isPrimary} /> },
  ];

  return (
    <ChildRecordSection<TaxRegistration>
      title="Tax Registrations"
      addLabel="Add Tax Registration"
      items={items}
      onChange={onChange}
      displayColumns={columns}
      idField="taxRegId"
      emptyItem={() => ({
        taxRegId: null,
        _localId: localId(),
        entityType,
        entityId: 0,
        taxType: taxTypeOptions.find((o) => o.label === 'VAT')?.value ?? 0,
        taxId: '',
        jurisdictionId: countries[0]?.countryId ?? 0,
        issuingAuthority: null,
        registrationDate: null,
        validFrom: null,
        validTo: null,
        isPrimary: items.length === 0,
        isActive: true,
        notes: null,
      })}
      renderFormFields={() => (
        <>
          <Form.Item
            name="taxType"
            label={hint('Tax Type', 'VAT/GST for most jurisdictions; EIN/UTR/TIN for country-specific tax IDs used on invoices and regulatory filings.')}
            rules={[{ required: true }]}
          >
            <Select options={taxTypeOptions} loading={loadingTaxTypes} />
          </Form.Item>
          <Form.Item
            name="taxId"
            label={hint('Registration Number', 'The tax authority-issued identifier — printed on invoices and used for tax reporting.', 'GB123456789')}
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g. GB123456789" />
          </Form.Item>
          <Form.Item
            name="jurisdictionId"
            label={hint('Jurisdiction', 'The country this registration was issued in — an entity can hold multiple registrations across jurisdictions it operates in.', 'GB')}
            rules={[{ required: true }]}
          >
            <Select options={countryOptions} loading={loadingCountries} showSearch optionFilterProp="label" placeholder="Select country" />
          </Form.Item>
          <Form.Item name="issuingAuthority" label="Issuing Authority">
            <Input placeholder="e.g. HMRC" />
          </Form.Item>
          <Form.Item
            name="registrationDate" label="Registration Date"
            getValueProps={(v) => ({ value: v ? dayjs(v) : undefined })}
            normalize={(v) => (v ? v.format('YYYY-MM-DD') : null)}
          >
            <AppDatePicker />
          </Form.Item>
          <Form.Item
            name="isPrimary"
            label={hint('Primary Registration', 'The default tax registration used when this entity’s tax ID needs to be shown on an invoice or filing.')}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </>
      )}
    />
  );
}
