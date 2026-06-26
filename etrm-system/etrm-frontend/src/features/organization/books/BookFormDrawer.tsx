import { useEffect } from 'react';
import { Drawer, Form, Input, Select, Button, Space, Switch, InputNumber } from 'antd';
import { useSaveBook } from './hooks';
import { BOOK_TYPES, type Book, type BookInput } from './types';
import { COMMODITY_TYPES } from '../desks/types';

interface Props {
  open: boolean;
  editing: Book | null;
  onClose: () => void;
}

export function BookFormDrawer({ open, editing, onClose }: Props) {
  const [form] = Form.useForm<BookInput>();
  const save = useSaveBook();

  useEffect(() => {
    if (open) {
      if (editing) {
        form.setFieldsValue({
          bookCode: editing.bookCode,
          bookName: editing.bookName,
          bookType: editing.bookType,
          deskId: editing.deskId,
          responsibleTraderId: editing.responsibleTraderId,
          commodityType: editing.commodityType,
          baseCurrencyId: editing.baseCurrencyId,
          positionLimit: editing.positionLimit,
          pnlLimit: editing.pnlLimit,
          varLimit: editing.varLimit,
          isActive: editing.isActive,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({ isActive: true, bookType: 'TRADING' });
      }
    }
  }, [open, editing, form]);

  async function submit() {
    const values = await form.validateFields();
    await save.mutateAsync({ id: editing?.bookId ?? null, input: values });
    onClose();
  }

  return (
    <Drawer
      title={editing ? `Edit Book — ${editing.bookCode}` : 'New P&L Book'}
      open={open}
      onClose={onClose}
      width={520}
      footer={
        <Space style={{ justifyContent: 'flex-end', display: 'flex' }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={submit} loading={save.isPending}>Save</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="bookCode" label="Book Code" rules={[{ required: true }]}>
          <Input placeholder="OIL-CRUDE-01" style={{ fontFamily: 'monospace' }} />
        </Form.Item>
        <Form.Item name="bookName" label="Book Name" rules={[{ required: true }]}>
          <Input placeholder="Crude Oil Physical Book" />
        </Form.Item>
        <Form.Item name="bookType" label="Book Type" rules={[{ required: true }]}>
          <Select options={BOOK_TYPES.map((t) => ({ label: t, value: t }))} />
        </Form.Item>
        <Form.Item name="deskId" label="Desk (ID)" rules={[{ required: true }]}>
          <Input type="number" placeholder="Desk ID" />
        </Form.Item>
        <Form.Item name="commodityType" label="Commodity Type">
          <Select allowClear placeholder="Multi-commodity if blank"
            options={COMMODITY_TYPES.map((c) => ({ label: c, value: c }))} />
        </Form.Item>
        <Form.Item name="baseCurrencyId" label="Base Currency (ID)" rules={[{ required: true }]}>
          <Input type="number" placeholder="Currency ID" />
        </Form.Item>
        <Form.Item name="responsibleTraderId" label="Responsible Trader (ID)">
          <Input type="number" placeholder="Trader ID" />
        </Form.Item>
        <Form.Item name="positionLimit" label="Position Limit (MT/BBL)">
          <InputNumber style={{ width: '100%' }} placeholder="500000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item name="pnlLimit" label="P&L Limit (USD)">
          <InputNumber style={{ width: '100%' }} placeholder="10000000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item name="varLimit" label="VaR Limit (USD)">
          <InputNumber style={{ width: '100%' }} placeholder="500000" formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
        </Form.Item>
        <Form.Item name="isActive" label="Active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
