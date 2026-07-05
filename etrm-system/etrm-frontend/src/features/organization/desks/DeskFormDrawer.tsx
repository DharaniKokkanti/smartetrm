import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Switch } from 'antd';
import { useSaveDesk } from './hooks';
import { COMMODITY_TYPE_LOOKUP, type Desk, type DeskInput } from './types';
import { useDraftValues } from '@components/smart/formDraft';

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
        <Form.Item name="deskCode" label="Desk Code" rules={[{ required: true }]}>
          <Input placeholder="OIL-CRUDE" style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="deskName" label="Desk Name" rules={[{ required: true }]}>
          <Input placeholder="Crude Oil Trading" />
        </Form.Item>
        <Form.Item name="legalEntityId" label="Legal Entity" rules={[{ required: true }]}>
          <Input type="number" placeholder="Entity ID" />
        </Form.Item>
        <Form.Item name="commodityType" label="Commodity Type">
          <Select allowClear placeholder="Multi-commodity if blank">
            {COMMODITY_TYPE_LOOKUP.map((l) => <Select.Option key={l.lookupId} value={l.lookupId}>{l.label}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="headTraderId" label="Head Trader (ID)">
          <Input type="number" placeholder="Trader ID" />
        </Form.Item>
        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
