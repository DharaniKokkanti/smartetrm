import { Form, Input, Select, Switch } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ChildRecordSection, PrimaryTag } from './ChildRecordSection';
import type { PolymorphicEntityType, TaxRegistration } from './types';
import { TAX_TYPES } from './types';
import { localId } from '@utils/localId';
import { AppDatePicker } from '@components/smart/AppDatePicker';
import dayjs from 'dayjs';

const TAX_TYPE_OPTIONS = TAX_TYPES.map((t) => ({ label: t, value: t }));

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
  const columns: ColumnsType<TaxRegistration> = [
    { title: 'Type', dataIndex: 'taxType', width: 90 },
    { title: 'Registration No.', dataIndex: 'taxId' },
    { title: 'Jurisdiction', dataIndex: 'jurisdiction', width: 100 },
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
      emptyItem={() => ({
        taxRegId: null,
        _localId: localId(),
        entityType,
        entityId: 0,
        taxType: 'VAT',
        taxId: '',
        jurisdiction: '',
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
          <Form.Item name="taxType" label="Tax Type" rules={[{ required: true }]}>
            <Select options={TAX_TYPE_OPTIONS} />
          </Form.Item>
          <Form.Item name="taxId" label="Registration Number" rules={[{ required: true }]}>
            <Input placeholder="e.g. GB123456789" />
          </Form.Item>
          <Form.Item name="jurisdiction" label="Jurisdiction (ISO 2)" rules={[{ required: true }, { len: 2, message: '2-letter code' }]}>
            <Input maxLength={2} style={{ textTransform: 'uppercase' }} />
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
          <Form.Item name="isPrimary" label="Primary Registration" valuePropName="checked">
            <Switch />
          </Form.Item>
        </>
      )}
    />
  );
}
