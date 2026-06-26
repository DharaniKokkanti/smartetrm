import { useEffect } from 'react';
import {
  Drawer,
  Form,
  Input,
  Select,
  Switch,
  DatePicker,
  Button,
  Space,
  Divider,
  Tabs,
} from 'antd';
import dayjs from 'dayjs';
import { ENTITY_TYPES, type LegalEntity, type LegalEntityInput } from './types';
import { useCreateLegalEntity, useUpdateLegalEntity, useLegalEntities } from './hooks';
import { EntityGuaranteesPanel } from '@features/tier1/guarantee/EntityGuaranteesPanel';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Present = editing; absent = creating new. */
  editing: LegalEntity | null;
}

const ENTITY_TYPE_OPTIONS = ENTITY_TYPES.map((t) => ({ label: t.replaceAll('_', ' '), value: t }));

type FormValues = Omit<LegalEntityInput, 'goLiveDate'> & { goLiveDate?: dayjs.Dayjs };

export function LegalEntityFormDrawer({ open, onClose, editing }: Props) {
  const [form] = Form.useForm<FormValues>();
  const { data: entities } = useLegalEntities();
  const createMutation = useCreateLegalEntity();
  const updateMutation = useUpdateLegalEntity();
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (open && editing) {
      form.setFieldsValue({
        ...editing,
        goLiveDate: editing.goLiveDate ? dayjs(editing.goLiveDate) : undefined,
      });
    } else if (open) {
      form.resetFields();
    }
  }, [open, editing, form]);

  const parentOptions = (entities ?? [])
    .filter((e) => e.legalEntityId !== editing?.legalEntityId)
    .map((e) => ({ label: `${e.entityCode} — ${e.entityName}`, value: e.legalEntityId }));

  async function handleSubmit() {
    const values = await form.validateFields();
    const input: LegalEntityInput = {
      ...values,
      goLiveDate: values.goLiveDate ? values.goLiveDate.format('YYYY-MM-DD') : null,
    };
    if (editing) {
      await updateMutation.mutateAsync({ id: editing.legalEntityId, input });
    } else {
      await createMutation.mutateAsync(input);
    }
    onClose();
  }

  return (
    <Drawer
      title={editing ? `Edit ${editing.entityCode}` : 'New Legal Entity'}
      width={560}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={saving}>
            Save
          </Button>
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
              <Form
                form={form}
                layout="vertical"
                initialValues={{ isInternal: true, baseCurrency: 'USD' }}
              >
                <Form.Item
                  name="entityCode"
                  label="Entity Code"
                  rules={[{ required: true, message: 'Required' }, { max: 20 }]}
                >
                  <Input placeholder="e.g. ACME-UK" disabled={!!editing} />
                </Form.Item>
                <Form.Item
                  name="entityName"
                  label="Entity Name"
                  rules={[{ required: true, message: 'Required' }, { max: 200 }]}
                >
                  <Input placeholder="e.g. Acme Trading UK Limited" />
                </Form.Item>
                <Form.Item
                  name="shortName"
                  label="Short Name"
                  rules={[{ required: true, message: 'Required' }, { max: 100 }]}
                >
                  <Input placeholder="e.g. Acme UK" />
                </Form.Item>
                <Form.Item name="leiCode" label="LEI Code" rules={[{ max: 20 }]}>
                  <Input placeholder="20-character Legal Entity Identifier" />
                </Form.Item>
                <Form.Item
                  name="entityType"
                  label="Entity Type"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Select options={ENTITY_TYPE_OPTIONS} placeholder="Select type" />
                </Form.Item>
                <Form.Item name="parentEntityId" label="Parent Entity">
                  <Select
                    options={parentOptions}
                    placeholder="None — top of hierarchy"
                    allowClear
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>

                <Divider style={{ margin: '8px 0 16px' }} />

                <Space.Compact block>
                  <Form.Item
                    name="jurisdiction"
                    label="Jurisdiction (ISO 2)"
                    style={{ width: '50%' }}
                    rules={[
                      { required: true, message: 'Required' },
                      { len: 2, message: '2-letter code' },
                    ]}
                  >
                    <Input placeholder="GB" maxLength={2} style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                  <Form.Item
                    name="incorporationCountry"
                    label="Incorporation Country"
                    style={{ width: '50%' }}
                    rules={[{ len: 2, message: '2-letter code' }]}
                  >
                    <Input placeholder="GB" maxLength={2} style={{ textTransform: 'uppercase' }} />
                  </Form.Item>
                </Space.Compact>

                <Form.Item name="incorporationNumber" label="Incorporation Number">
                  <Input placeholder="Companies House number, etc." />
                </Form.Item>

                <Form.Item
                  name="baseCurrency"
                  label="Base Currency (ISO 3)"
                  rules={[
                    { required: true, message: 'Required' },
                    { len: 3, message: '3-letter code' },
                  ]}
                >
                  <Input placeholder="USD" maxLength={3} style={{ textTransform: 'uppercase' }} />
                </Form.Item>
                <Form.Item name="defaultTimezone" label="Default Timezone">
                  <Input placeholder="Europe/London" />
                </Form.Item>

                <Divider style={{ margin: '8px 0 16px' }} />

                <Form.Item name="regulator" label="Regulator">
                  <Input placeholder="e.g. FCA" />
                </Form.Item>
                <Form.Item name="regulatoryLicence" label="Regulatory Licence">
                  <Input />
                </Form.Item>
                <Form.Item name="isInternal" label="Internal Entity" valuePropName="checked">
                  <Switch />
                </Form.Item>
                <Form.Item name="goLiveDate" label="Go-Live Date">
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
                <Form.Item name="notes" label="Notes">
                  <Input.TextArea rows={3} maxLength={1000} showCount />
                </Form.Item>
              </Form>
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
