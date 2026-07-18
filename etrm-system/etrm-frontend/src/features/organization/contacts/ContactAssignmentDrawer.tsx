import { useEffect, useMemo, useState } from 'react';
import { Drawer, Form, Input, Select, Segmented, Switch, Button, Space, Typography } from 'antd';
import type { ContactAssignment } from '@features/tier1/counterparty/types';
import type { PolymorphicEntityType } from '@features/tier1/counterparty/types';
import { useSaveContactAssignment } from '@features/tier1/counterparty/hooks';
import { useCustomConfigOptions } from '@features/tier1/counterparty/configLookups';
import { useCounterparties } from '@features/tier1/counterparty/hooks';
import { useLegalEntities } from '@features/tier1/legal-entity/hooks';
import { useDraftValues } from '@components/smart/formDraft';
import { hint } from '@components/smart/FieldHint';
import { localId } from '@utils/localId';

const ENTITY_TYPE_OPTIONS = [
  { label: 'Counterparty', value: 'COUNTERPARTY' },
  { label: 'Legal Entity (us)', value: 'LEGAL_ENTITY' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  editing: ContactAssignment | null;
}

interface FormValues {
  entityId: number;
  contactRole: number;
  isPrimary: boolean;
  firstName: string;
  lastName: string;
  jobTitle: string | null;
  email: string | null;
  phoneMobile: string | null;
  phoneDirect: string | null;
  phoneMain: string | null;
}

/** Standalone create/edit drawer for one contact assignment, used by the
 *  cross-entity Contacts Directory page (ContactsDirectoryPage). This is a
 *  genuinely new component — ContactsSection.tsx's editor is built around a
 *  local items[]/onChange array (staged, saved only when the parent
 *  Counterparty/Legal Entity form is saved), which doesn't fit a directory
 *  page backed by its own per-record save endpoint. Reuses the same
 *  saveContactAssignment API call (via useSaveContactAssignment) that
 *  ContactsSection ultimately persists through on parent-form save, so the
 *  wire shape and mock endpoint are identical — only the editing chrome
 *  (entity picker up front, immediate save) is new.
 *
 *  "Link existing contact" (ContactsSection's other mode) is intentionally
 *  out of scope here: when editing an already-linked assignment, the name/
 *  contact-detail fields are shown read-only and only role/primary are
 *  editable, matching what ContactsSection itself allows for linked
 *  contacts. */
export function ContactAssignmentDrawer({ open, onClose, editing }: Props) {
  const [form] = Form.useForm<FormValues>();
  const skipDraftReset = useDraftValues('contact-assignment-v', form, open, editing);
  const saveAssignment = useSaveContactAssignment();
  const { data: roleOptions = [], isLoading: loadingRoles } = useCustomConfigOptions('CONTACT_ROLE');
  const { data: counterparties = [] } = useCounterparties();
  const { data: legalEntities = [] } = useLegalEntities();

  const [entityType, setEntityType] = useState<PolymorphicEntityType>('COUNTERPARTY');
  const isLinked = editing?.isLinked ?? false;

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
        entityId: editing.entityId,
        contactRole: editing.contactRole,
        isPrimary: editing.isPrimary,
        firstName: editing.contact.firstName,
        lastName: editing.contact.lastName,
        jobTitle: editing.contact.jobTitle,
        email: editing.contact.email,
        phoneMobile: editing.contact.phoneMobile,
        phoneDirect: editing.contact.phoneDirect,
        phoneMain: editing.contact.phoneMain,
      });
    } else {
      setEntityType('COUNTERPARTY');
      form.resetFields();
      form.setFieldsValue({ isPrimary: false } as Partial<FormValues>);
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [open, editing, form]);

  async function handleSubmit() {
    const values = await form.validateFields();

    const assignment: ContactAssignment = isLinked
      ? {
          ...editing!,
          entityType,
          entityId: values.entityId,
          contactRole: values.contactRole,
          isPrimary: values.isPrimary,
        }
      : {
          entityContactId: editing?.entityContactId ?? null,
          _localId: editing?._localId ?? localId(),
          entityType,
          entityId: values.entityId,
          contactId: editing?.contact.contactId ?? null,
          contact: {
            contactId: editing?.contact.contactId ?? null,
            _localId: editing?.contact._localId ?? localId(),
            salutation: null,
            firstName: values.firstName,
            lastName: values.lastName,
            jobTitle: values.jobTitle ?? null,
            email: values.email ?? null,
            phoneMobile: values.phoneMobile ?? null,
            phoneDirect: values.phoneDirect ?? null,
            phoneMain: values.phoneMain ?? null,
            isActive: true,
            notes: null,
          },
          contactRole: values.contactRole,
          isPrimary: values.isPrimary,
          isActive: true,
          isLinked: false,
        };

    await saveAssignment.mutateAsync(assignment);
    onClose();
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit Contact — ${editing.contact.firstName} ${editing.contact.lastName}` : 'New Contact'}
      width={480}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        <Space>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit} loading={saveAssignment.isPending}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
          {hint('Owning Entity', 'Which counterparty or legal entity this contact belongs to — every contact record is owned by exactly one entity.')}
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

        <Form.Item name="contactRole" label={hint('Role', 'This person’s function for this entity — e.g. the trading, credit, or legal contact — used to route the right document/query to the right person.')} rules={[{ required: true }]}>
          <Select options={roleOptions} loading={loadingRoles} />
        </Form.Item>

        {isLinked ? (
          <div style={{ marginBottom: 16, padding: '8px 10px', background: 'rgba(127,127,127,0.08)', borderRadius: 4, fontSize: 12 }}>
            <strong>{editing!.contact.firstName} {editing!.contact.lastName}</strong>
            {editing!.contact.jobTitle ? ` — ${editing!.contact.jobTitle}` : ''}
            <div>Linked from the shared contact pool — edit contact details from the entity's own Contacts tab.</div>
          </div>
        ) : (
          <>
            <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="jobTitle" label="Job Title">
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ type: 'email' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phoneMobile" label="Mobile">
              <Input placeholder="+44 7700 900000" />
            </Form.Item>
            <Form.Item name="phoneDirect" label="Direct Line">
              <Input placeholder="+44 20 7946 0000" />
            </Form.Item>
            <Form.Item name="phoneMain" label="Main / Reception">
              <Input placeholder="+44 20 7946 0000" />
            </Form.Item>
          </>
        )}

        <Form.Item name="isPrimary" label={hint('Primary Contact', 'The default contact shown when only one contact can be surfaced, e.g. on a confirmation or statement.')} valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
