import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Switch } from 'antd';
import { useSaveDesk } from './hooks';
import { COMMODITY_TYPE_LOOKUP, type Desk, type DeskInput } from './types';
import { useDraftValues } from '@components/smart/formDraft';
import { hint } from '@components/smart/FieldHint';
import { safeTextRule, integerRule } from '@components/smart/fieldValidation';

interface Props {
  open: boolean;
  editing: Desk | null;
  onClose: () => void;
  onSaved?: (saved: Desk) => void;  // called on Save (stay open) so parent can switch to edit mode
}

export function DeskFormDrawer({ open, editing, onClose, onSaved }: Props) {
  const [form] = Form.useForm<DeskInput>();
  const save = useSaveDesk();
  const skipDraftReset = useDraftValues('org-desks-v', form, open, editing);

  useEffect(() => {
    if (skipDraftReset.current) { if (open) skipDraftReset.current = false; return; }
    if (open) {
      if (editing) {
        form.setFieldsValue({
          deskCode: editing.deskCode,
          deskName: editing.deskName,
          legalEntityId: editing.legalEntityId,
          commodityType: editing.commodityType,
          headTraderId: editing.headTraderId,
          isActive: editing.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldValue('isActive', true);
      }
    }
  }, [open, editing, form]);

  async function submit(closeAfter = true) {
    const values = await form.validateFields();
    const saved = await save.mutateAsync({ id: editing?.deskId ?? null, input: values });
    if (closeAfter) onClose(); else onSaved?.(saved);
  }

  return (
    <Drawer mask={false} forceRender
      title={editing ? `Edit Desk — ${editing.deskCode}` : 'New Trading Desk'}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={() => { void submit(false); }} loading={save.isPending}>Save</Button>
          <Button type="primary" onClick={() => { void submit(true); }} loading={save.isPending}>Save & Close</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="deskCode"
          label={hint('Desk Code', 'Short unique identifier for this trading desk — used in position, P&L, and limit reporting.', 'OIL-CRUDE')}
          rules={[{ required: true }, safeTextRule()]}
        >
          <Input placeholder="OIL-CRUDE" style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="deskName" label="Desk Name" rules={[{ required: true }, safeTextRule()]}>
          <Input placeholder="Crude Oil Trading" />
        </Form.Item>
        <Form.Item
          name="legalEntityId"
          label={hint('Legal Entity', 'The booking company this desk trades under — drives which legal entity trades booked to this desk settle against.')}
          rules={[{ required: true }, integerRule()]}
        >
          <Input type="number" placeholder="Entity ID" />
        </Form.Item>
        <Form.Item
          name="commodityType"
          label={hint('Commodity Type', 'Restricts this desk to one commodity for position/limit segregation. Leave blank for a multi-commodity desk.')}
        >
          <Select allowClear placeholder="Multi-commodity if blank">
            {COMMODITY_TYPE_LOOKUP.map((l) => <Select.Option key={l.lookupId} value={l.lookupId}>{l.label}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item
          name="headTraderId"
          label={hint('Head Trader (ID)', 'The trader accountable for this desk’s risk and P&L — shown on desk-level reports.')}
          rules={[integerRule()]}
        >
          <Input type="number" placeholder="Trader ID" />
        </Form.Item>
        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
