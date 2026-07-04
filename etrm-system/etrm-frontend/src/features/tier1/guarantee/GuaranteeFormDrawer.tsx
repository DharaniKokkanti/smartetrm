import { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Segmented,
  Switch,
    InputNumber,
  Button,
  Space,
  Divider,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import {
  PCG_STATUSES,
  defaultPartyTypesFor,
  type ParentCompanyGuarantee,
  type ParentCompanyGuaranteeInput,
  type PcgDirection,
} from './types';
import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';
import { useSaveGuarantee } from './hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { CURRENCY_LOOKUP } from '@features/tier1/counterparty/staticLookups';
import { useDraftValues } from '@components/smart/formDraft';
import { AppDatePicker } from '@components/smart/AppDatePicker';

const DIRECTION_OPTIONS = [
  { label: 'Received — their parent guarantees to us', value: 'RECEIVED' },
  { label: 'Issued — our parent guarantees to them', value: 'ISSUED' },
];
const STATUS_OPTIONS = PCG_STATUSES.map((s) => ({ label: s, value: s }));
const CURRENCY_OPTIONS = CURRENCY_LOOKUP.map((c) => ({
  label: c.currencyCode,
  value: c.currencyId,
}));
const ROLE_TYPE_OPTIONS = [
  { label: 'Legal Entity (us)', value: 'LEGAL_ENTITY' },
  { label: 'Counterparty', value: 'COUNTERPARTY' },
];

interface RoleFieldProps {
  label: string;
  fieldName: 'guarantorEntityId' | 'principalEntityId' | 'beneficiaryEntityId';
  type: PolymorphicEntityType;
  options: { label: string; value: number }[];
  onTypeChange: (t: PolymorphicEntityType) => void;
}

/**
 * Top-level component, NOT declared inside GuaranteeFormDrawer. Declaring it
 * inline there was a real bug, not just a lint nag: a new component
 * function (and thus a new component *type*) was created on every render,
 * which makes React unmount and remount the Segmented/Select here on every
 * keystroke elsewhere in the form — losing focus and any in-progress
 * interaction in these fields constantly. Reads the active Form instance
 * via Form.useFormInstance() rather than receiving it as a prop, same as
 * any other Form.Item-adjacent field component would.
 */
function RoleField({ label, fieldName, type, options, onTypeChange }: RoleFieldProps) {
  const form = Form.useFormInstance();
  return (
    <div style={{ marginBottom: 16 }}>
      <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
        {label}
      </Typography.Text>
      <Segmented
        options={ROLE_TYPE_OPTIONS}
        value={type}
        onChange={(v) => {
          onTypeChange(v as PolymorphicEntityType);
          form.setFieldValue(fieldName, undefined);
        }}
        style={{ marginBottom: 8, display: 'block' }}
      />
      <Form.Item
        name={fieldName}
        rules={[{ required: true, message: `Select a ${label.toLowerCase()}` }]}
        style={{ marginBottom: 0 }}
      >
        <Select
          options={options}
          showSearch
          optionFilterProp="label"
          placeholder={`Select ${label.toLowerCase()}`}
        />
      </Form.Item>
    </div>
  );
}

export interface PcgPrefill {
  role: 'guarantor' | 'principal' | 'beneficiary';
  entityType: PolymorphicEntityType;
  entityId: number;
}

interface Props {
  open: boolean;
  onClose: () => void;
  editing: ParentCompanyGuarantee | null;
  prefill?: PcgPrefill;
}

type FormValues = Omit<ParentCompanyGuaranteeInput, 'issueDate' | 'expiryDate'> & {
  issueDate?: dayjs.Dayjs;
  expiryDate?: dayjs.Dayjs;
};

export function GuaranteeFormDrawer({ open, onClose, editing, prefill }: Props) {
  const [form] = Form.useForm<FormValues>();
  const skipDraftReset = useDraftValues('guarantee-v', form, open, editing);
  const saveGuarantee = useSaveGuarantee();
  const { data: legalEntities } = useLegalEntities();
  const { data: counterparties } = useCounterparties();

  const [guarantorType, setGuarantorType] = useState<PolymorphicEntityType>('COUNTERPARTY');
  const [principalType, setPrincipalType] = useState<PolymorphicEntityType>('COUNTERPARTY');
  const [beneficiaryType, setBeneficiaryType] = useState<PolymorphicEntityType>('LEGAL_ENTITY');

  const legalEntityOptions = useMemo(
    () =>
      (legalEntities ?? []).map((e) => ({
        label: `${e.entityCode} — ${e.entityName}`,
        value: e.legalEntityId,
      })),
    [legalEntities],
  );
  const counterpartyOptions = useMemo(
    () =>
      (counterparties ?? []).map((c) => ({
        label: `${c.cpCode} — ${c.legalName}`,
        value: c.counterpartyId,
      })),
    [counterparties],
  );

  function optionsFor(type: PolymorphicEntityType) {
    return type === 'LEGAL_ENTITY' ? legalEntityOptions : counterpartyOptions;
  }

  useEffect(() => {
    if (!open) return;
    if (skipDraftReset.current) { if (open) skipDraftReset.current = false; return; }
    // Deliberate: hydrates local role-type state (guarantorType/principalType/
    // beneficiaryType) from the `editing` record when the drawer opens for an
    // existing guarantee, or from `prefill` when opening fresh. This is a
    // one-time setup on open, not a value that should track `editing` on
    // every render — the standard accepted exception to "don't sync state in
    // effects."
    /* eslint-disable react-hooks/set-state-in-effect */
    if (editing) {
      setGuarantorType(editing.guarantorEntityType);
      setPrincipalType(editing.principalEntityType);
      setBeneficiaryType(editing.beneficiaryEntityType);
      form.setFieldsValue({
        ...editing,
        issueDate: editing.issueDate ? dayjs(editing.issueDate) : undefined,
        expiryDate: editing.expiryDate ? dayjs(editing.expiryDate) : undefined,
      });
    } else {
      const defaults = defaultPartyTypesFor('RECEIVED');
      let g = defaults.guarantor;
      let p = defaults.principal;
      let b = defaults.beneficiary;
      const overrides: Partial<FormValues> = {
        direction: 'RECEIVED',
        pcgStatus: 'DRAFT',
        isEvergreen: false,
      };
      if (prefill) {
        if (prefill.role === 'guarantor') {
          g = prefill.entityType;
          overrides.guarantorEntityType = prefill.entityType;
          overrides.guarantorEntityId = prefill.entityId;
        } else if (prefill.role === 'principal') {
          p = prefill.entityType;
          overrides.principalEntityType = prefill.entityType;
          overrides.principalEntityId = prefill.entityId;
        } else {
          b = prefill.entityType;
          overrides.beneficiaryEntityType = prefill.entityType;
          overrides.beneficiaryEntityId = prefill.entityId;
        }
      }
      setGuarantorType(g);
      setPrincipalType(p);
      setBeneficiaryType(b);
      form.resetFields();
      form.setFieldsValue(overrides as FormValues);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing, prefill, form]);

  function handleDirectionChange(direction: PcgDirection) {
    const defaults = defaultPartyTypesFor(direction);
    setGuarantorType(defaults.guarantor);
    setPrincipalType(defaults.principal);
    setBeneficiaryType(defaults.beneficiary);
    form.setFieldsValue({
      guarantorEntityType: defaults.guarantor,
      guarantorEntityId: undefined,
      principalEntityType: defaults.principal,
      principalEntityId: undefined,
      beneficiaryEntityType: defaults.beneficiary,
      beneficiaryEntityId: undefined,
    });
  }

  async function handleSubmit() {
    const values = await form.validateFields();
    const input: ParentCompanyGuaranteeInput = {
      ...values,
      guarantorEntityType: guarantorType,
      principalEntityType: principalType,
      beneficiaryEntityType: beneficiaryType,
      issueDate: values.issueDate ? values.issueDate.format('YYYY-MM-DD') : '',
      expiryDate: values.expiryDate ? values.expiryDate.format('YYYY-MM-DD') : null,
    };
    await saveGuarantee.mutateAsync({ id: editing?.pcgId ?? null, input });
    onClose();
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit ${editing.pcgReference}` : 'New Parent Company Guarantee'}
      width={560}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={saveGuarantee.isPending}>
            Save
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="pcgReference"
          label="PCG Reference"
          rules={[{ required: true }, { max: 50 }]}
        >
          <Input placeholder="e.g. PCG-2026-0001" disabled={!!editing} />
        </Form.Item>
        <Form.Item name="direction" label="Direction" rules={[{ required: true }]}>
          <Select
            options={DIRECTION_OPTIONS}
            onChange={handleDirectionChange}
            disabled={!!editing}
          />
        </Form.Item>

        <Divider style={{ margin: '4px 0 16px' }} />

        <RoleField
          label="Guarantor (provides the guarantee)"
          fieldName="guarantorEntityId"
          type={guarantorType}
          options={optionsFor(guarantorType)}
          onTypeChange={setGuarantorType}
        />
        <RoleField
          label="Principal (whose obligations are covered)"
          fieldName="principalEntityId"
          type={principalType}
          options={optionsFor(principalType)}
          onTypeChange={setPrincipalType}
        />
        <RoleField
          label="Beneficiary (who is protected)"
          fieldName="beneficiaryEntityId"
          type={beneficiaryType}
          options={optionsFor(beneficiaryType)}
          onTypeChange={setBeneficiaryType}
        />

        <Divider style={{ margin: '4px 0 16px' }} />

        <Space.Compact block>
          <Form.Item
            name="guaranteeAmount"
            label="Guarantee Amount"
            style={{ width: '65%' }}
            rules={[{ required: true }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="currencyId"
            label="Currency"
            style={{ width: '35%' }}
            rules={[{ required: true }]}
          >
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>
        </Space.Compact>

        <Form.Item name="issueDate" label="Issue Date" rules={[{ required: true }]}>
          <AppDatePicker />
        </Form.Item>
        <Form.Item name="isEvergreen" label="Evergreen (auto-renews)" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.isEvergreen !== cur.isEvergreen}>
          {({ getFieldValue }) =>
            !getFieldValue('isEvergreen') && (
              <Form.Item name="expiryDate" label="Expiry Date">
                <AppDatePicker />
              </Form.Item>
            )
          }
        </Form.Item>
        <Form.Item name="pcgStatus" label="Status" rules={[{ required: true }]}>
          <Select options={STATUS_OPTIONS} />
        </Form.Item>
        <Form.Item noStyle shouldUpdate={(prev, cur) => prev.pcgStatus !== cur.pcgStatus}>
          {({ getFieldValue }) =>
            getFieldValue('pcgStatus') === 'CALLED' && (
              <Form.Item name="amountCalled" label="Amount Called" rules={[{ required: true }]}>
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            )
          }
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} maxLength={1000} showCount />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
