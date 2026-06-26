import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Switch } from 'antd';
import { useSaveDesk } from './hooks';
import { COMMODITY_TYPES, type Desk, type DeskInput } from './types';

interface Props {
  open: boolean;
  editing: Desk | null;
  onClose: () => void;
}

export function DeskFormDrawer({ open, editing, onClose }: Props) {
  const [form] = Form.useForm<DeskInput>();
  const save = useSaveDesk();

  useEffect(() => {
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

  async function submit() {
    const values = await form.validateFields();
    await save.mutateAsync({ id: editing?.deskId ?? null, input: values });
    onClose();
  }

  return (
    <Drawer
      title={editing ? `Edit Desk — ${editing.deskCode}` : 'New Trading Desk'}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
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
            {COMMODITY_TYPES.map((c) => <Select.Option key={c} value={c}>{c}</Select.Option>)}
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
